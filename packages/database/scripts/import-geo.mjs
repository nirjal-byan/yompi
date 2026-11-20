import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const only = process.env.GEO_ONLY ? process.env.GEO_ONLY.split(",").map((x) => x.trim()) : null;
const want = (section) => !only || only.includes(section);
const USER_AGENT = "yompi-geo-import/0.1";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const BBOX = "26.3,80.0,30.5,88.3";

const SOURCES = {
  geoboundaries: {
    key: "geoboundaries-gbopen",
    name: "geoBoundaries gbOpen",
    url: "https://www.geoboundaries.org",
    license: "CC BY 4.0",
    attribution: "Country boundary: geoBoundaries (William & Mary geoLab), CC BY 4.0",
  },
  osm: {
    key: "openstreetmap",
    name: "OpenStreetMap",
    url: "https://www.openstreetmap.org/copyright",
    license: "ODbL 1.0",
    attribution: "© OpenStreetMap contributors",
  },
};

const PEAKS = [
  ["Mount Everest", ["Mount Everest", "Sagarmatha", "Chomolungma"]],
  ["Lhotse", ["Lhotse"]],
  ["Makalu", ["Makalu", "Mount Makalu"]],
  ["Cho Oyu", ["Cho Oyu"]],
  ["Kangchenjunga", ["Kangchenjunga", "Kanchenjunga", "Kangchendzonga", "Kanchanjunga"]],
  ["Manaslu", ["Manaslu", "Kutang"]],
  ["Dhaulagiri", ["Dhaulagiri", "Dhaulagiri I"]],
  ["Annapurna I", ["Annapurna", "Annapurna I"]],
  ["Annapurna South", ["Annapurna South"]],
  [
    "Machhapuchhre",
    [
      "Machhapuchhre",
      "Machapuchare",
      "Machhapuchare",
      "Machhapuchre",
      "Machhapuchchhre",
      "Fishtail",
    ],
  ],
  ["Gangapurna", ["Gangapurna"]],
  ["Hiunchuli", ["Hiunchuli"]],
  ["Tilicho Peak", ["Tilicho Peak"]],
  ["Mardi Himal", ["Mardi Himal"]],
  ["Poon Hill", ["Poon Hill", "Poonhill"]],
  ["Ama Dablam", ["Ama Dablam"]],
  ["Pumori", ["Pumori"]],
  ["Nuptse", ["Nuptse", "Nuptse I"]],
  ["Thamserku", ["Thamserku"]],
  ["Kangtega", ["Kangtega", "Kantega"]],
  ["Cholatse", ["Cholatse"]],
  ["Lobuche East", ["Lobuche East"]],
  ["Island Peak", ["Island Peak", "Imja Tse"]],
  ["Mera Peak", ["Mera Peak"]],
  ["Baruntse", ["Baruntse"]],
  ["Kala Patthar", ["Kala Patthar", "Kalapatthar"]],
  ["Gokyo Ri", ["Gokyo Ri"]],
  ["Langtang Lirung", ["Langtang Lirung"]],
  ["Gauri Sankar", ["Gauri Sankar", "Gaurishankar"]],
];

const LAKES = [
  ["Tilicho Lake", ["Tilicho Lake", "Tilicho Tal", "Tilicho"]],
  ["Rara Lake", ["Rara Lake", "Rara Tal", "Mahendra Tal", "Rara Daha"]],
  [
    "Phoksundo Lake",
    ["Phoksundo Lake", "Phoksundo Tal", "Shey Phoksundo Lake", "Phoksundo", "Phoksumdo Lake"],
  ],

  ["Gosaikunda", ["Gosaikunda", "Gosainkunda", "Gosainkund", "Gosaikunda Lake", "Gosain Kunda"]],
  ["Phewa Lake", ["Phewa Lake", "Phewa Tal", "Fewa Lake", "Fewa Tal", "Phewa"]],
  ["Imja Tsho", ["Imja Tsho", "Imja Lake"]],
  ["Tsho Rolpa", ["Tsho Rolpa", "Chho Rolpa", "Rolpa Lake"]],
  ["Birendra Lake", ["Birendra Tal", "Birendra Lake", "Birendra Taal"]],
];

const PASSES = [
  [
    "Thorong La",
    ["Thorong La", "Thorung La", "Thorong La Pass", "Thorung La Pass", "Thorong Pass"],
  ],
  ["Cho La", ["Cho La", "Cho La Pass"]],
  ["Renjo La", ["Renjo La", "Renjo La Pass"]],
  ["Kongma La", ["Kongma La", "Kongma La Pass"]],
  ["Larkya La", ["Larkya La", "Larkya Pass", "Larkya La Pass", "Larke La", "Larkye La"]],
  ["Mesokanto La", ["Mesokanto La", "Mesokanto Pass", "Mesokanto La Pass"]],
  ["Laurebina La", ["Laurebina La", "Laurebina Pass", "Laurabina La", "Laurebina Yak"]],

  ["Teri La", ["Teri La", "Teri La Pass"]],
  ["Saribung La", ["Saribung La", "Saribung Pass"]],
  ["Sherpani Col", ["Sherpani Col"]],
  ["Amphu Labtsa", ["Amphu Labtsa", "Amphu Laptsa", "Amphulapcha"]],
  ["Pangsang La", ["Pangsang La", "Pangsang Pass", "Pangsang La Pass"]],
  ["Nangpa La", ["Nangpa La"]],
];

const IMPORTANT_CITIES = ["Kathmandu", "Pokhara"];

const GATEWAY_NAMES = [
  "Lukla",
  "Phakding",
  "Namche Bazaar",
  "Jomsom",
  "Muktinath",
  "Manang",
  "Besisahar",
  "Syabrubesi",
  "Dhunche",
  "Arughat",
  "Nayapul",
];

const TRAIL_RELATION_IDS = [1187310, 17548991, 1328173, 1269089, 11077478];

const keptRefs = new Map();

async function upsertSource(source) {
  const rows = await prisma.$queryRaw`
    INSERT INTO "DataSource" (id, key, name, url, license, attribution)
    VALUES (gen_random_uuid()::text, ${source.key}, ${source.name}, ${source.url}, ${source.license}, ${source.attribution})
    ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url,
      license = EXCLUDED.license, attribution = EXCLUDED.attribution
    RETURNING id`;
  return rows[0].id;
}

async function upsertFeature({
  kind,
  name,
  nameLocal = null,
  elevationM = null,
  properties = {},
  geometry,
  sourceId,
  sourceRef,
}) {
  if (!keptRefs.has(kind)) keptRefs.set(kind, new Set());
  keptRefs.get(kind).add(sourceRef);
  await prisma.$executeRaw`
    INSERT INTO "GeoFeature" (id, kind, name, "nameLocal", "elevationM", properties, geometry, "sourceId", "sourceRef", "fetchedAt")
    VALUES (gen_random_uuid()::text, ${kind}::"GeoFeatureKind", ${name}, ${nameLocal}::text, ${elevationM}::int,
      ${JSON.stringify(properties)}::jsonb,
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326), ${sourceId}, ${sourceRef}, now())
    ON CONFLICT ("sourceId", "sourceRef") DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name,
      "nameLocal" = EXCLUDED."nameLocal", "elevationM" = EXCLUDED."elevationM",
      properties = EXCLUDED.properties, geometry = EXCLUDED.geometry, "fetchedAt" = now()`;
}

async function pruneStale(sourceId) {
  for (const [kind, refs] of keptRefs) {
    if (refs.size === 0) continue;
    const removed = await prisma.$executeRaw`
      DELETE FROM "GeoFeature"
      WHERE kind = ${kind}::"GeoFeatureKind" AND "sourceId" = ${sourceId} AND "sourceRef" <> ALL(${[...refs]}::text[])`;
    if (removed > 0) console.log(`pruned   : ${removed} stale ${kind} rows`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function overpass(query) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    await sleep(2000);
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) {
      const json = await res.json();

      if (!json.remark || !/runtime error|timed out|out of memory/i.test(json.remark))
        return json.elements;
      console.log(
        `  overpass remark: ${json.remark.slice(0, 80)}, retry ${attempt}/5 in ${attempt * 10}s`,
      );
      await sleep(attempt * 10_000);
      continue;
    }
    if (res.status !== 429 && res.status < 500) throw new Error(`Overpass responded ${res.status}`);
    console.log(`  overpass ${res.status}, retry ${attempt}/5 in ${attempt * 10}s`);
    await sleep(attempt * 10_000);
  }
  throw new Error("Overpass is unavailable, try again later");
}

const pointOf = (el) => ({
  type: "Point",
  coordinates: [el.lon ?? el.center.lon, el.lat ?? el.center.lat],
});
const englishName = (tags) => tags["name:en"] ?? tags.name;
const localName = (tags) =>
  tags["name:ne"] ?? (tags["name:en"] && tags.name !== tags["name:en"] ? tags.name : null);
const elevationOf = (tags) => {
  const value = parseFloat(String(tags.ele ?? "").replace(",", "."));
  return Number.isFinite(value) ? Math.round(value) : null;
};

async function findCurated(entries, selectors, label, { inNepal = false } = {}) {
  const everyAlias = entries.flatMap(([, aliases]) => aliases);
  const regex = `^(${everyAlias.join("|")})$`;
  const scope = inNepal ? "(area.a)" : `(${BBOX})`;
  const parts = selectors.flatMap((selector) => [
    `${selector}["name"~"${regex}",i]${scope};`,
    `${selector}["name:en"~"${regex}",i]${scope};`,
  ]);
  const prefix = inNepal ? 'area["ISO3166-1"="NP"]->.a;' : "";
  const elements = await overpass(
    `[out:json][timeout:180];${prefix}(${parts.join("")});out center tags;`,
  );

  const best = new Map();
  for (const el of elements) {
    const names = [el.tags.name, el.tags["name:en"]].filter(Boolean).map((n) => n.toLowerCase());
    const entry = entries.find(([, aliases]) =>
      aliases.some((alias) => names.includes(alias.toLowerCase())),
    );
    if (!entry) continue;
    const current = best.get(entry[0]);
    if (!current || (elevationOf(el.tags) ?? 0) > (elevationOf(current.tags) ?? 0))
      best.set(entry[0], el);
  }
  const missing = entries.map(([name]) => name).filter((name) => !best.has(name));
  console.log(
    `${label.padEnd(9)}: ${best.size} of ${entries.length}${missing.length ? ` (not in OSM: ${missing.join(", ")})` : ""}`,
  );
  return best;
}

function lineLengthKm(lines) {
  const rad = Math.PI / 180;
  let km = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [lon1, lat1] = line[i - 1];
      const [lon2, lat2] = line[i];
      const a =
        Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
      km += 2 * 6371 * Math.asin(Math.sqrt(a));
    }
  }
  return km;
}

async function importBoundary() {
  const meta = await (
    await fetch("https://www.geoboundaries.org/api/current/gbOpen/NPL/ADM0/", {
      headers: { "User-Agent": USER_AGENT },
    })
  ).json();
  const collection = await (
    await fetch(meta.simplifiedGeometryGeoJSON, { headers: { "User-Agent": USER_AGENT } })
  ).json();
  const sourceId = await upsertSource(SOURCES.geoboundaries);
  await upsertFeature({
    kind: "COUNTRY_BOUNDARY",
    name: "Nepal",
    nameLocal: "नेपाल",
    properties: { release: meta.boundaryYearRepresented ?? null },
    geometry: collection.features[0].geometry,
    sourceId,
    sourceRef: "NPL-ADM0",
  });
  console.log("boundary : Nepal (geoBoundaries, simplified)");
}

async function importCurated(kind, entries, selectors, label, sourceId, options) {
  const found = await findCurated(entries, selectors, label, options);
  for (const [displayName, el] of found) {
    await upsertFeature({
      kind,
      name: displayName,
      nameLocal: el.tags["name:ne"] ?? (el.tags.name !== displayName ? el.tags.name : null),
      elevationM: elevationOf(el.tags),
      properties: { osmName: el.tags.name ?? null },
      geometry: pointOf(el),
      sourceId,
      sourceRef: `${el.type}/${el.id}`,
    });
  }
}

async function importPlaces(sourceId) {
  const area = `area["ISO3166-1"="NP"]->.a;`;

  if (want("peaks"))
    await importCurated(
      "PEAK",
      PEAKS,
      ['node["natural"="peak"]', 'node["tourism"="viewpoint"]'],
      "peaks",
      sourceId,
    );
  if (want("lakes"))
    await importCurated(
      "LAKE",
      LAKES,
      ['way["natural"="water"]', 'relation["natural"="water"]'],
      "lakes",
      sourceId,
      { inNepal: true },
    );
  if (want("passes"))
    await importCurated(
      "PASS",
      PASSES,
      ['node["mountain_pass"="yes"]', 'node["natural"="saddle"]'],
      "passes",
      sourceId,
    );

  if (want("cities")) {
    const cityNames = IMPORTANT_CITIES.join("|");
    const cities = await overpass(
      `[out:json][timeout:90];${area}(node(area.a)["place"~"city|town"]["name:en"~"^(${cityNames})$"];` +
        `node(area.a)["place"~"city|town"]["name"~"^(${cityNames})$"];);out;`,
    );
    const seenCities = new Set();
    for (const el of cities) {
      const name = englishName(el.tags);
      if (seenCities.has(name)) continue;
      seenCities.add(name);
      await upsertFeature({
        kind: "CITY",
        name,
        nameLocal: localName(el.tags),
        geometry: pointOf(el),
        sourceId,
        sourceRef: `node/${el.id}`,
      });
    }
    console.log(
      `cities   : ${seenCities.size} of ${IMPORTANT_CITIES.length} (${[...seenCities].join(", ")})`,
    );
  }

  if (want("gateways")) {
    const names = GATEWAY_NAMES.join("|");
    const gateways = await overpass(
      `[out:json][timeout:90];${area}(node(area.a)["place"~"town|village|hamlet|locality"]["name:en"~"^(${names})$"];` +
        `node(area.a)["place"~"town|village|hamlet|locality"]["name"~"^(${names})$"];);out;`,
    );
    const seen = new Set();
    for (const el of gateways) {
      const name = englishName(el.tags);
      if (seen.has(name)) continue;
      seen.add(name);
      await upsertFeature({
        kind: "GATEWAY",
        name,
        nameLocal: localName(el.tags),
        geometry: pointOf(el),
        sourceId,
        sourceRef: `node/${el.id}`,
      });
    }
    console.log(`gateways : ${seen.size} of ${GATEWAY_NAMES.length} (${[...seen].join(", ")})`);
  }
}

async function importTrails(sourceId) {
  const relations = await overpass(
    `[out:json][timeout:120];relation(id:${TRAIL_RELATION_IDS.join(",")});out geom;`,
  );
  for (const rel of relations) {
    const lines = rel.members
      .filter((m) => m.type === "way" && m.geometry?.length > 1)
      .map((m) => m.geometry.map((p) => [p.lon, p.lat]));
    if (lines.length === 0) {
      console.log(`trail    : SKIPPED ${rel.tags.name} (no way geometry; relation/${rel.id})`);
      continue;
    }
    await upsertFeature({
      kind: "TRAIL",
      name: rel.tags.name,
      properties: {
        route: rel.tags.route ?? null,
        network: rel.tags.network ?? null,
        osmDistanceKm: rel.tags.distance ? Number(rel.tags.distance) : null,
        computedKm: Math.round(lineLengthKm(lines)),
      },
      geometry: { type: "MultiLineString", coordinates: lines },
      sourceId,
      sourceRef: `relation/${rel.id}`,
    });
    console.log(
      `trail    : ${rel.tags.name} - ${lines.length} segments, ~${lineLengthKm(lines).toFixed(0)} km (relation/${rel.id})`,
    );
  }
}

try {
  if (want("boundary")) await importBoundary();
  const osmId = await upsertSource(SOURCES.osm);
  await importPlaces(osmId);
  if (want("trails")) await importTrails(osmId);
  await pruneStale(osmId);
  console.log("done");
} finally {
  await prisma.$disconnect();
}

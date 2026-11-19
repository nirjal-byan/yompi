// Imports real-world geodata into the GeoFeature table. Safe to re-run (upserts by source + ref).
//
//   pnpm db:import-geo
//
// Uses raw SQL only, so it does not depend on the generated Prisma models.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const USER_AGENT = "yompi-geo-import/0.1";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

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

// OSM relation ids of trekking routes. Curated by hand from OSM search results; the route
// geometry itself comes from OSM. Everest Base Camp and Upper Mustang have no suitable
// relation in OSM yet, so they are intentionally absent rather than invented. Mardi Himal
// (2 km mapped) and Everest South Col (a climbing route) were rejected as misleading.
// Some imported trails are only partly mapped: compare properties.computedKm to osmDistanceKm.
const TRAIL_RELATION_IDS = [1187310, 17548991, 1328173, 1269089, 11077478];

// Trek gateways, matched by name inside Nepal. Coordinates come from OSM.
const GATEWAY_NAMES = [
  "Lukla", "Phakding", "Namche Bazaar", "Jomsom", "Muktinath", "Manang", "Besisahar",
  "Syabrubesi", "Dhunche", "Arughat", "Nayapul",
];

async function upsertSource(source) {
  const rows = await prisma.$queryRaw`
    INSERT INTO "DataSource" (id, key, name, url, license, attribution)
    VALUES (gen_random_uuid()::text, ${source.key}, ${source.name}, ${source.url}, ${source.license}, ${source.attribution})
    ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, url = EXCLUDED.url,
      license = EXCLUDED.license, attribution = EXCLUDED.attribution
    RETURNING id`;
  return rows[0].id;
}

async function upsertFeature({ kind, name, nameLocal = null, elevationM = null, properties = {}, geometry, sourceId, sourceRef }) {
  await prisma.$executeRaw`
    INSERT INTO "GeoFeature" (id, kind, name, "nameLocal", "elevationM", properties, geometry, "sourceId", "sourceRef", "fetchedAt")
    VALUES (gen_random_uuid()::text, ${kind}::"GeoFeatureKind", ${name}, ${nameLocal}::text, ${elevationM}::int,
      ${JSON.stringify(properties)}::jsonb,
      ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 4326), ${sourceId}, ${sourceRef}, now())
    ON CONFLICT ("sourceId", "sourceRef") DO UPDATE SET kind = EXCLUDED.kind, name = EXCLUDED.name,
      "nameLocal" = EXCLUDED."nameLocal", "elevationM" = EXCLUDED."elevationM",
      properties = EXCLUDED.properties, geometry = EXCLUDED.geometry, "fetchedAt" = now()`;
}

// The public Overpass server is shared and rate limited: pause between calls, retry on 429/5xx.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function overpass(query) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    await sleep(2000);
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "User-Agent": USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) return (await res.json()).elements;
    if (res.status !== 429 && res.status < 500) throw new Error(`Overpass responded ${res.status}`);
    console.log(`  overpass ${res.status}, retry ${attempt}/5 in ${attempt * 10}s`);
    await sleep(attempt * 10_000);
  }
  throw new Error("Overpass is unavailable, try again later");
}

const pointOf = (el) => ({ type: "Point", coordinates: [el.lon, el.lat] });
const englishName = (tags) => tags["name:en"] ?? tags.name;
const localName = (tags) => tags["name:ne"] ?? (tags["name:en"] && tags.name !== tags["name:en"] ? tags.name : null);

function lineLengthKm(lines) {
  const rad = Math.PI / 180;
  let km = 0;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const [lon1, lat1] = line[i - 1];
      const [lon2, lat2] = line[i];
      const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
        Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
      km += 2 * 6371 * Math.asin(Math.sqrt(a));
    }
  }
  return km;
}

async function importBoundary() {
  const meta = await (await fetch("https://www.geoboundaries.org/api/current/gbOpen/NPL/ADM0/", { headers: { "User-Agent": USER_AGENT } })).json();
  const collection = await (await fetch(meta.simplifiedGeometryGeoJSON, { headers: { "User-Agent": USER_AGENT } })).json();
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

async function importPlaces(sourceId) {
  const area = `area["ISO3166-1"="NP"]->.a;`;

  const peaks = await overpass(
    `[out:json][timeout:90];${area}node(area.a)["natural"="peak"]["name"]["ele"~"^(5[5-9]|[6-8][0-9])[0-9]{2}(\\.[0-9]+)?$"];out;`,
  );
  let peakCount = 0;
  for (const el of peaks) {
    const elevationM = Math.round(parseFloat(el.tags.ele));
    if (!Number.isFinite(elevationM)) continue;
    await upsertFeature({
      kind: "PEAK", name: englishName(el.tags), nameLocal: localName(el.tags), elevationM,
      geometry: pointOf(el), sourceId, sourceRef: `node/${el.id}`,
    });
    peakCount++;
  }
  console.log(`peaks    : ${peakCount} (5,500 m and above)`);

  const cities = await overpass(`[out:json][timeout:90];${area}node(area.a)["place"="city"]["name"];out;`);
  for (const el of cities) {
    await upsertFeature({
      kind: "CITY", name: englishName(el.tags), nameLocal: localName(el.tags),
      geometry: pointOf(el), sourceId, sourceRef: `node/${el.id}`,
    });
  }
  console.log(`cities   : ${cities.length}`);

  const names = GATEWAY_NAMES.join("|");
  const gateways = await overpass(
    `[out:json][timeout:90];${area}(node(area.a)["place"~"town|village|hamlet|locality"]["name:en"~"^(${names})$"];` +
      `node(area.a)["place"~"town|village|hamlet|locality"]["name"~"^(${names})$"];);out;`,
  );
  const seen = new Set();
  for (const el of gateways) {
    const name = englishName(el.tags);
    if (seen.has(name)) continue; // keep one entry per gateway name
    seen.add(name);
    await upsertFeature({
      kind: "GATEWAY", name, nameLocal: localName(el.tags),
      geometry: pointOf(el), sourceId, sourceRef: `node/${el.id}`,
    });
  }
  console.log(`gateways : ${seen.size} of ${GATEWAY_NAMES.length} (${[...seen].join(", ")})`);
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
      properties: { route: rel.tags.route ?? null, network: rel.tags.network ?? null, osmDistanceKm: rel.tags.distance ? Number(rel.tags.distance) : null, computedKm: Math.round(lineLengthKm(lines)) },
      geometry: { type: "MultiLineString", coordinates: lines },
      sourceId,
      sourceRef: `relation/${rel.id}`,
    });
    console.log(`trail    : ${rel.tags.name} - ${lines.length} segments, ~${lineLengthKm(lines).toFixed(0)} km (relation/${rel.id})`);
  }
}

try {
  await importBoundary();
  const osmId = await upsertSource(SOURCES.osm);
  await importPlaces(osmId);
  await importTrails(osmId);
  console.log("done");
} finally {
  await prisma.$disconnect();
}

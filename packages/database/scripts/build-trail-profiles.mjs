import { PrismaClient } from "@prisma/client";
import { PNG } from "pngjs";

const prisma = new PrismaClient();
const TILE_ZOOM = 12;
const TILE_PX = 256;
const SPACING_KM = 0.25;
const SMOOTH_WINDOW = 5;
const MIN_SECTION_KM = 2;
const JOIN_TOLERANCE_KM = 0.05;
const METHOD =
  "Elevation sampled every 250 m from SRTM/GMTED2010 (AWS Terrain Tiles, zoom 12), smoothed over 1.25 km. " +
  "Ascent and descent are estimates and typically differ from GPS tracks by 10% or more.";

const RAD = Math.PI / 180;

function distanceKm(a, b) {
  const dLat = (b[1] - a[1]) * RAD;
  const dLon = (b[0] - a[0]) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const lengthKm = (line) =>
  line.slice(1).reduce((total, point, i) => total + distanceKm(line[i], point), 0);

function chain(lines) {
  const pool = lines.map((line) => line.slice());
  const sections = [];
  while (pool.length) {
    let current = pool.shift();
    let grew = true;
    while (grew) {
      grew = false;
      for (let i = 0; i < pool.length; i++) {
        const line = pool[i];
        const head = current[0];
        const tail = current[current.length - 1];
        const first = line[0];
        const last = line[line.length - 1];
        let next = null;
        if (distanceKm(tail, first) < JOIN_TOLERANCE_KM) next = current.concat(line.slice(1));
        else if (distanceKm(tail, last) < JOIN_TOLERANCE_KM)
          next = current.concat(line.slice(0, -1).reverse());
        else if (distanceKm(head, last) < JOIN_TOLERANCE_KM) next = line.concat(current.slice(1));
        else if (distanceKm(head, first) < JOIN_TOLERANCE_KM)
          next = line.slice().reverse().concat(current.slice(1));
        if (next) {
          current = next;
          pool.splice(i, 1);
          grew = true;
          break;
        }
      }
    }
    sections.push(current);
  }
  return sections.sort((a, b) => lengthKm(b) - lengthKm(a));
}

function resample(line, stepKm) {
  const out = [line[0]];
  let carry = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const segment = distanceKm(a, b);
    if (segment === 0) continue;
    let travelled = stepKm - carry;
    while (travelled <= segment) {
      const t = travelled / segment;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      travelled += stepKm;
    }
    carry = segment - (travelled - stepKm);
  }
  const last = line[line.length - 1];
  if (distanceKm(out[out.length - 1], last) > stepKm / 4) out.push(last);
  return out;
}

const tileCache = new Map();

async function loadTile(x, y) {
  const key = `${x}/${y}`;
  if (!tileCache.has(key)) {
    tileCache.set(
      key,
      (async () => {
        const res = await fetch(
          `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${TILE_ZOOM}/${x}/${y}.png`,
        );
        if (!res.ok) throw new Error(`tile ${key} responded ${res.status}`);
        return PNG.sync.read(Buffer.from(await res.arrayBuffer())).data;
      })(),
    );
  }
  return tileCache.get(key);
}

const WORLD_PX = 2 ** TILE_ZOOM * TILE_PX;

function globalPixel(lon, lat) {
  const sin = Math.sin(lat * RAD);
  return [
    ((lon + 180) / 360) * WORLD_PX,
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * WORLD_PX,
  ];
}

async function pixelElevation(px, py) {
  const tx = Math.floor(px / TILE_PX);
  const ty = Math.floor(py / TILE_PX);
  const data = await loadTile(tx, ty);
  const i = ((py - ty * TILE_PX) * TILE_PX + (px - tx * TILE_PX)) * 4;
  return data[i] * 256 + data[i + 1] + data[i + 2] / 256 - 32768;
}

async function elevationAt(lon, lat) {
  const [gx, gy] = globalPixel(lon, lat);
  const x0 = Math.floor(gx - 0.5);
  const y0 = Math.floor(gy - 0.5);
  const fx = gx - 0.5 - x0;
  const fy = gy - 0.5 - y0;
  const [a, b, c, d] = await Promise.all([
    pixelElevation(x0, y0),
    pixelElevation(x0 + 1, y0),
    pixelElevation(x0, y0 + 1),
    pixelElevation(x0 + 1, y0 + 1),
  ]);
  return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy;
}

function smooth(values, window) {
  const half = Math.floor(window / 2);
  return values.map((_, i) => {
    let sum = 0;
    let count = 0;
    for (let k = Math.max(0, i - half); k <= Math.min(values.length - 1, i + half); k++) {
      sum += values[k];
      count++;
    }
    return sum / count;
  });
}

async function profileFor(line) {
  const oriented = line[0][0] > line[line.length - 1][0] ? line.slice().reverse() : line;
  const samples = resample(oriented, SPACING_KM);
  const raw = [];
  for (const [lon, lat] of samples) raw.push(await elevationAt(lon, lat));
  const elevations = smooth(raw, SMOOTH_WINDOW);

  let ascent = 0;
  let descent = 0;
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1];
    if (delta > 0) ascent += delta;
    else descent -= delta;
  }
  let highest = -Infinity;
  let highestAt = samples[0];
  samples.forEach((point, i) => {
    if (elevations[i] > highest) {
      highest = elevations[i];
      highestAt = point;
    }
  });
  return {
    lengthKm: Math.round(lengthKm(oriented) * 10) / 10,
    elevationsM: elevations.map(Math.round),
    ascent,
    descent,
    highest,
    highestAt,
    lowest: Math.min(...elevations),
  };
}

try {
  const trails = await prisma.$queryRaw`
    SELECT id, name, ST_AsGeoJSON(geometry, 6)::json AS geometry FROM "GeoFeature" WHERE kind = 'TRAIL'`;
  console.log(`${trails.length} trails to profile`);

  for (const trail of trails) {
    const sections = chain(trail.geometry.coordinates).filter(
      (section) => lengthKm(section) >= MIN_SECTION_KM,
    );
    const skipped = chain(trail.geometry.coordinates).length - sections.length;
    const profiles = [];
    for (const section of sections) profiles.push(await profileFor(section));
    if (profiles.length === 0) {
      console.log(`  ${trail.name}: no section of ${MIN_SECTION_KM} km or more, skipped`);
      continue;
    }

    const best = profiles.reduce((a, b) => (b.highest > a.highest ? b : a));
    const profile = {
      method: METHOD,
      spacingKm: SPACING_KM,
      sections: profiles.map((p) => ({ lengthKm: p.lengthKm, elevationsM: p.elevationsM })),
      highestM: Math.round(best.highest),
      highestAt: best.highestAt.map((v) => Math.round(v * 1e5) / 1e5),
      lowestM: Math.round(Math.min(...profiles.map((p) => p.lowest))),
      ascentM: Math.round(profiles.reduce((t, p) => t + p.ascent, 0)),
      descentM: Math.round(profiles.reduce((t, p) => t + p.descent, 0)),
    };
    await prisma.$executeRaw`
      UPDATE "GeoFeature" SET properties = COALESCE(properties, '{}'::jsonb) || ${JSON.stringify({ profile })}::jsonb
      WHERE id = ${trail.id}`;
    console.log(
      `  ${trail.name}: ${profiles.length} section(s) [${profile.sections.map((s) => s.lengthKm + " km").join(", ")}]` +
        `${skipped ? ` (+${skipped} tiny fragment(s) ignored)` : ""} | high ${profile.highestM} m, low ${profile.lowestM} m, ` +
        `ascent ~${profile.ascentM} m, descent ~${profile.descentM} m`,
    );
  }
  console.log(`done (${tileCache.size} elevation tiles read)`);
} finally {
  await prisma.$disconnect();
}

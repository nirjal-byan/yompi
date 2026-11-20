import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const W = 128;
const H = 150;
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "brand",
  "join-scene.png",
);

const hex = (h) => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const C = Object.fromEntries(
  Object.entries({
    ink: "#3b2a26",
    cream: "#faf6ee",
    amber: "#ffb43e",
    amberLight: "#ffd98a",
    orange: "#e0702e",
    orangeDark: "#b9561f",
    sky0: "#86b3d4",
    sky1: "#a6c8de",
    sky2: "#c4dce8",
    sky3: "#e2eae6",
    sky4: "#f5ead2",
    sky5: "#fbe0b0",
    snowLit: "#fbfdff",
    snowMid: "#dbe6f3",
    snowShade: "#a9bfdc",
    rockLit: "#9a8c94",
    rockMid: "#74667a",
    rockShade: "#53495f",
    forestDark: "#244a30",
    forest: "#2f5d3a",
    forestLight: "#4a7d4c",
    g1: "#b7cf8e",
    g2: "#9cc27a",
    g3: "#86b36b",
    g4: "#6fa35f",
    gEdge: "#5f8f52",
    water: "#4f9fc6",
    waterLight: "#8cc7de",
    sand: "#ead9a8",
    trail: "#e2b35c",
    trailDark: "#b98a3e",
    wall: "#f6ead2",
    flagBlue: "#3c78c8",
    flagRed: "#d8483c",
    flagGreen: "#3a9d5d",
    flagWhite: "#f6f1e6",
    cloud: "#fff8ec",
  }).map(([k, v]) => [k, hex(v)]),
);

const px = Buffer.alloc(W * H * 4);
const put = (x, y, c) => {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
  px[i + 3] = 255;
};
const get = (x, y) => {
  const i = (Math.round(y) * W + Math.round(x)) * 4;
  return [px[i], px[i + 1], px[i + 2]];
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261120);
const makeNoise = (seed) => {
  const r = mulberry32(seed);
  const table = Array.from({ length: 512 }, () => r());
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const t = f * f * (3 - 2 * f);
    return table[i & 511] * (1 - t) + table[(i + 1) & 511] * t;
  };
};
const nFine = makeNoise(23);
const nHill = makeNoise(37);
const nTex = makeNoise(51);

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x, y) => BAYER[(y & 3) * 4 + (x & 3)] / 16;

function sprite(rows, ox, oy, colors) {
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => colors[ch] && put(ox + x, oy + y, colors[ch])),
  );
}

const SKY = [C.sky0, C.sky1, C.sky2, C.sky3, C.sky4, C.sky5];
const SKY_END = 92;
const BAND = SKY_END / (SKY.length - 1);
for (let y = 0; y < H; y++) {
  const band = Math.min(SKY.length - 2, Math.floor(y / BAND));
  const local = y / BAND - band;
  const blend = clamp((local - 0.6) / 0.4, 0, 1);
  for (let x = 0; x < W; x++) put(x, y, bayer(x, y) < blend ? SKY[band + 1] : SKY[band]);
}

const SUN = { x: 92, y: 52, r: 8 };
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - SUN.x, y - SUN.y);
    if (d <= SUN.r) put(x, y, C.amber);
    else if (d <= SUN.r + 4 && bayer(x, y) < 0.55) put(x, y, C.amberLight);
    else if (d <= SUN.r + 8 && bayer(x, y) < 0.18) put(x, y, C.amberLight);
  }
}

const cloud = (cx, cy, w) => {
  for (let x = -w; x <= w; x++) {
    const h = Math.round(Math.sqrt(Math.max(0, 1 - (x / w) ** 2)) * 2.4);
    for (let y = -h; y <= 0; y++) put(cx + x, cy + y, C.cloud);
  }
};
cloud(30, 58, 8);
cloud(52, 53, 5);
cloud(112, 62, 7);

const RANGE_BASE = 92;
const SNOW_LINE = 74;

const PEAKS = [
  { x: 6, y: 72, s: 1.5 },
  { x: 22, y: 60, s: 1.3 },
  { x: 37, y: 42, s: 1.55 },
  { x: 55, y: 64, s: 1.25 },
  { x: 72, y: 58, s: 1.4 },
  { x: 88, y: 68, s: 1.3 },
  { x: 105, y: 46, s: 1.65 },
  { x: 123, y: 66, s: 1.35 },
];
const outline = (x) => {
  let best = Infinity;
  let peak = 0;
  PEAKS.forEach((p, i) => {
    const y = p.y + Math.abs(x - p.x) * p.s + (nFine(x * 0.55 + i * 7) - 0.5) * 3.2;
    if (y < best) {
      best = y;
      peak = i;
    }
  });
  return { y: best, peak };
};
for (let x = 0; x < W; x++) {
  const { y: top, peak } = outline(x);
  const lit = x < PEAKS[peak].x;
  const rib = nTex(x * 0.85 + peak * 13) > 0.7;
  for (let y = Math.floor(top); y < RANGE_BASE + 4; y++) {
    const snowLine =
      SNOW_LINE + (nTex(x * 0.4 + 70) - 0.5) * 9 + (nTex(y * 0.7 + x * 0.2) - 0.5) * 3;
    const snow = y < snowLine;
    let c;
    if (snow) c = lit ? C.snowLit : C.snowShade;
    else c = lit ? C.rockLit : C.rockShade;
    if (snow && lit && rib) c = C.snowMid;
    if (!snow && rib) c = mix(c, C.rockShade, 0.4);
    if (y - top < 1.2 && snow) c = C.snowLit;

    if (y > RANGE_BASE - 9 && bayer(x, y) < (y - (RANGE_BASE - 9)) / 12) c = mix(c, C.sky4, 0.55);
    put(x, y, c);
  }
}

const ridge2 = (x) => 94 - (4 + 9 * nHill(x * 0.06 + 9) + 4 * nFine(x * 0.21 + 5));
for (let x = 0; x < W; x++) {
  const top = ridge2(x);
  for (let y = Math.floor(top); y < 104; y++) {
    const depth = y - top;
    let c = depth < 1.2 ? C.forestLight : depth < 5 ? C.forest : C.forestDark;
    if (bayer(x, y) < 0.12 && depth > 1) c = C.forestLight;
    put(x, y, c);
  }
}

const pine = (x, y) => {
  put(x, y - 4, C.forestDark);
  [-1, 0, 1].forEach((d) => put(x + d, y - 3, C.forestDark));
  [-1, 0, 1].forEach((d) => put(x + d, y - 2, C.forest));
  [-2, -1, 0, 1, 2].forEach((d) => put(x + d, y - 1, C.forestDark));
  put(x, y, C.ink);
  put(x - 1, y - 2, C.forestLight);
};
for (let x = 4; x < W - 3; x += 5 + Math.floor(rand() * 4)) pine(x, Math.round(ridge2(x)) + 5);

const GROUND = 96;
const TONES = [C.g1, C.g2, C.g3, C.g4];
for (let y = GROUND; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const t = y - GROUND + 1;
    const warp = Math.sin(x * 0.11 + t * 0.03) * 1.3 + Math.sin(x * 0.045 + 1.2) * 1.6;
    const band = Math.sqrt(t) * 3.1 + warp * (0.5 + t / 60);
    const idx = Math.floor(band);
    const frac = band - idx;
    let c = TONES[((idx % 4) + 4) % 4];
    if (frac < 0.16) c = C.gEdge;
    else if (frac > 0.85) c = mix(c, C.g1, 0.5);
    if (bayer(x + idx, y) < 0.05) c = mix(c, C.cream, 0.25);

    const edge = Math.min(x, W - 1 - x);
    if (edge < 10 && bayer(x, y) < (10 - edge) / 16) c = mix(c, C.forest, 0.4);
    put(x, y, c);
  }
}

const riverX = (y) => 70 + 19 * Math.sin((y - 96) * 0.085) + (y - 96) * 0.12;
const riverW = (y) => 1.1 + (y - 96) * 0.07;
for (let y = GROUND; y < H; y++) {
  const cx = riverX(y);
  const w = riverW(y);
  for (let x = Math.floor(cx - w - 2); x <= Math.ceil(cx + w + 2); x++) {
    const d = Math.abs(x - cx);
    if (d <= w) put(x, y, d > w - 1 ? C.waterLight : bayer(x, y) < 0.1 ? C.waterLight : C.water);
    else if (d <= w + 1.2) put(x, y, C.sand);
  }
}

const trailX = (y) => riverX(y) - 17 - (y - 96) * 0.1 + 5 * Math.sin((y - 90) * 0.12 + 1);
for (let y = GROUND + 1; y < H; y++) {
  const w = 0.9 + (y - 96) * 0.03;
  const cx = trailX(y);
  for (let x = Math.floor(cx - w - 1); x <= Math.ceil(cx + w + 1); x++) {
    const d = Math.abs(x - cx);
    if (d <= w) put(x, y, bayer(x, y) < 0.15 ? C.trailDark : C.trail);
    else if (d <= w + 1 && bayer(x, y) < 0.5) put(x, y, C.trailDark);
  }
}

const HOUSE = { r: C.orange, R: C.orangeDark, w: C.wall, k: C.ink };
const house = (x, y, big) =>
  sprite(
    big
      ? ["..RRR..", ".RrrrR.", "RrrrrrR", ".wwwww.", ".wkwkw.", ".wkwkw."]
      : ["..RR..", ".Rrr R".replace(" ", "r"), "RrrrrR", ".wwww.", ".wkkw."],
    x,
    y,
    HOUSE,
  );
house(98, 103, false);
house(106, 107, false);
house(20, 107, false);
house(88, 118, true);
house(104, 125, true);
house(30, 120, true);

for (let i = 0; i < 26; i++) {
  const y = 100 + Math.floor(rand() * 46);
  const x = 4 + Math.floor(rand() * (W - 8));
  if (Math.abs(x - riverX(y)) < riverW(y) + 5 || Math.abs(x - trailX(y)) < 5) continue;
  const c = get(x, y);
  if (c[0] > 200 && c[1] > 190 && c[2] < 140) continue;
  pine(x, y);
}

const poles = [
  [9, 99],
  [27, 98],
];
poles.forEach(([x, y]) => [0, 1, 2, 3, 4, 5, 6, 7].forEach((d) => put(x, y - d, C.ink)));
const FLAGS = [C.flagBlue, C.flagWhite, C.flagRed, C.flagGreen, C.amber];
for (let x = poles[0][0] + 1; x < poles[1][0]; x++) {
  const t = (x - poles[0][0]) / (poles[1][0] - poles[0][0]);
  const y = 92 + Math.round(4 * Math.sin(Math.PI * t));
  put(x, y, C.ink);
  if ((x - poles[0][0]) % 2 === 0) {
    const flag = FLAGS[((x - poles[0][0]) / 2) % FLAGS.length];
    put(x, y + 1, flag);
    put(x, y + 2, flag);
  }
}

const RABBIT = { k: C.ink, w: C.cream, o: C.orange, O: C.orangeDark, p: [236, 160, 150] };
const rabbit = [
  "....kk..kk...",
  "...kwwk.kwwk.",
  "...kwpk.kwpk.",
  "...kwwk.kwwk.",
  "...kwwkkwwwk.",
  "..kwwwwwwwwwk",
  "..kwwwkwwwwwk",
  ".kOOkwwwwwwk.",
  "kOooOkwwwwk..",
  "kOooOkkwwwk..",
  "kOooOkwwwwk..",
  ".kOOkwwwwwk..",
  "..kkkwwkwwk..",
  "....kkk.kkk..",
];
const rx = Math.round(trailX(124)) - 6;
sprite(rabbit, rx, 112, RABBIT);

function crc32(buf) {
  let c;
  let crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), 8 + data.length);
  return out;
};
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, encodePng(W, H, px));
console.log(
  `wrote ${path.relative(process.cwd(), OUT)} (${W}x${H}, ${fs.statSync(OUT).size} bytes)`,
);

if (process.env.PREVIEW) {
  const S = 5;
  const big = Buffer.alloc(W * S * H * S * 4);
  for (let y = 0; y < H * S; y++)
    for (let x = 0; x < W * S; x++)
      px.copy(
        big,
        (y * W * S + x) * 4,
        (Math.floor(y / S) * W + Math.floor(x / S)) * 4,
        (Math.floor(y / S) * W + Math.floor(x / S)) * 4 + 4,
      );
  fs.writeFileSync(process.env.PREVIEW, encodePng(W * S, H * S, big));
}

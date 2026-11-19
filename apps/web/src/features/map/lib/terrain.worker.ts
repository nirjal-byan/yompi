/**
 * Terrain tile worker. Downloads one elevation tile, shades it (colour by height, hillshade from
 * real slopes, snow above the snow line) and sends back an ImageBitmap. All of this runs off the
 * main thread so loading terrain never stalls panning and zooming.
 */
const TILE_PX = 256;
const PADDED = TILE_PX + 2;

// Elevation (m) -> RGB. Lowland plains to alpine rock; snow is added separately.
const RAMP: Array<[number, number, number, number]> = [
  [0, 183, 205, 140],
  [300, 164, 196, 122],
  [800, 140, 182, 104],
  [1500, 112, 160, 92],
  [2300, 84, 138, 84],
  [3200, 74, 118, 74],
  [3800, 140, 148, 96],
  [4400, 168, 150, 120],
  [5000, 150, 132, 118],
  [6500, 128, 116, 108],
];
const SNOW_LIT = [250, 252, 255];
const SNOW_SHADE = [166, 182, 214];
const SNOW_LINE_START = 4900;
const SNOW_LINE_FULL = 5700;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const smoothstep = (edge0: number, edge1: number, v: number) => {
  const t = clamp((v - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

// The ramp only changes per metre of height, so colour it once per 8 m step instead of per pixel.
const RAMP_STEP = 8;
const RAMP_LUT = (() => {
  const size = Math.ceil(9000 / RAMP_STEP) + 1;
  const lut = new Float32Array(size * 3);
  for (let i = 0; i < size; i++) {
    const elev = i * RAMP_STEP;
    let rgb = [RAMP[RAMP.length - 1][1], RAMP[RAMP.length - 1][2], RAMP[RAMP.length - 1][3]];
    if (elev <= RAMP[0][0]) rgb = [RAMP[0][1], RAMP[0][2], RAMP[0][3]];
    else {
      for (let k = 1; k < RAMP.length; k++) {
        if (elev <= RAMP[k][0]) {
          const [e0, r0, g0, b0] = RAMP[k - 1];
          const [e1, r1, g1, b1] = RAMP[k];
          const t = (elev - e0) / (e1 - e0);
          rgb = [r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t];
          break;
        }
      }
    }
    lut.set(rgb, i * 3);
  }
  return lut;
})();

function shade(src: Uint8ClampedArray, z: number, tileY: number): ImageData {
  // Elevation with a 1px border so the slope filter needs no edge checks.
  const elev = new Float32Array(PADDED * PADDED);
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const i = (y * TILE_PX + x) * 4;
      elev[(y + 1) * PADDED + x + 1] = src[i] * 256 + src[i + 1] + src[i + 2] / 256 - 32768;
    }
  }
  for (let i = 1; i <= TILE_PX; i++) {
    elev[i] = elev[PADDED + i]; // top
    elev[(PADDED - 1) * PADDED + i] = elev[TILE_PX * PADDED + i]; // bottom
    elev[i * PADDED] = elev[i * PADDED + 1]; // left
    elev[i * PADDED + PADDED - 1] = elev[i * PADDED + TILE_PX]; // right
  }
  elev[0] = elev[PADDED + 1];
  elev[PADDED - 1] = elev[PADDED + TILE_PX];
  elev[(PADDED - 1) * PADDED] = elev[TILE_PX * PADDED + 1];
  elev[PADDED * PADDED - 1] = elev[TILE_PX * PADDED + TILE_PX];

  // Real ground size of one pixel at this tile's latitude, so slopes are physically meaningful.
  const n = 2 ** z;
  const lat = Math.atan(Math.sinh(Math.PI * (1 - (2 * (tileY + 0.5)) / n)));
  const metersPerPx = (156543.03392 * Math.cos(lat)) / n;
  const exaggeration = z <= 8 ? 3.2 : z <= 10 ? 2.4 : 1.9;
  const k = 1 / (8 * metersPerPx);
  // Sun from the north-west, 45 degrees above the horizon.
  const lx = -0.5;
  const ly = 0.5;
  const lz = 0.7071;

  const out = new ImageData(TILE_PX, TILE_PX);
  const data = out.data;
  for (let y = 0; y < TILE_PX; y++) {
    for (let x = 0; x < TILE_PX; x++) {
      const p = (y + 1) * PADDED + x + 1;
      const a = elev[p - PADDED - 1], b = elev[p - PADDED], c = elev[p - PADDED + 1];
      const d = elev[p - 1], f = elev[p + 1];
      const g = elev[p + PADDED - 1], h = elev[p + PADDED], i = elev[p + PADDED + 1];
      const dEast = (c + 2 * f + i - (a + 2 * d + g)) * k;
      const dNorth = (a + 2 * b + c - (g + 2 * h + i)) * k;
      const nx = -dEast * exaggeration;
      const ny = -dNorth * exaggeration;
      const shadeValue = clamp((nx * lx + ny * ly + lz) / Math.hypot(nx, ny, 1) / lz, 0, 1.4);

      const height = elev[p];
      const light = 0.52 + 0.48 * shadeValue;
      const lutIndex = clamp(Math.round(height / RAMP_STEP), 0, RAMP_LUT.length / 3 - 1) * 3;

      // Snow caps: above the snow line, thinner where the ground is too steep to hold it.
      let snow = 0;
      if (height > SNOW_LINE_START) {
        const slopeDeg = (Math.atan(Math.hypot(dEast, dNorth)) * 180) / Math.PI;
        snow = smoothstep(SNOW_LINE_START, SNOW_LINE_FULL, height) * (1 - 0.65 * smoothstep(48, 70, slopeDeg));
      }
      const t = shadeValue < 1 ? shadeValue : 1;
      const o = (y * TILE_PX + x) * 4;
      data[o] = RAMP_LUT[lutIndex] * light * (1 - snow) + (SNOW_SHADE[0] + (SNOW_LIT[0] - SNOW_SHADE[0]) * t) * snow;
      data[o + 1] = RAMP_LUT[lutIndex + 1] * light * (1 - snow) + (SNOW_SHADE[1] + (SNOW_LIT[1] - SNOW_SHADE[1]) * t) * snow;
      data[o + 2] = RAMP_LUT[lutIndex + 2] * light * (1 - snow) + (SNOW_SHADE[2] + (SNOW_LIT[2] - SNOW_SHADE[2]) * t) * snow;
      data[o + 3] = 255;
    }
  }
  return out;
}

interface TileRequest {
  id: number;
  url: string;
  z: number;
  y: number;
}

const worker = self as unknown as Worker;

worker.onmessage = async (event: MessageEvent<TileRequest>) => {
  const { id, url, z, y } = event.data;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`tile ${res.status}`);
    const source = await createImageBitmap(await res.blob());
    const canvas = new OffscreenCanvas(TILE_PX, TILE_PX);
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(source, 0, 0);
    source.close();
    ctx.putImageData(shade(ctx.getImageData(0, 0, TILE_PX, TILE_PX).data, z, y), 0, 0);
    const bitmap = canvas.transferToImageBitmap();
    worker.postMessage({ id, bitmap }, [bitmap]);
  } catch {
    worker.postMessage({ id, bitmap: null });
  }
};

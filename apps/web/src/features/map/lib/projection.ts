/**
 * Real geography -> flat "world" units (Web Mercator, scaled so Nepal is ~140 units wide).
 * This is the only place that knows about longitude/latitude; the visual styling of the map
 * lives in map-engine.ts and never touches real coordinates.
 */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** World units per radian of longitude. Shared with the terrain tile maths. */
export const WORLD_SCALE = 1000;
/**
 * Scene units per world unit. Static geometry (outline, trails, terrain) is built once in scene
 * space and the camera just scales and moves that scene, so panning needs no redrawing.
 */
export const SPACE = 8;
const K = WORLD_SCALE;

export function project(lon: number, lat: number): { x: number; y: number } {
  const x = ((lon * Math.PI) / 180) * K;
  const y = -Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * K;
  return { x, y };
}

export function emptyBounds(): Bounds {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function extendBounds(bounds: Bounds, x: number, y: number): void {
  if (x < bounds.minX) bounds.minX = x;
  if (y < bounds.minY) bounds.minY = y;
  if (x > bounds.maxX) bounds.maxX = x;
  if (y > bounds.maxY) bounds.maxY = y;
}

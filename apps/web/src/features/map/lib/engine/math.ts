import type { Rect } from "./types";

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const rectsOverlap = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

export function distanceToSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const dx = endX - startX;
  const dy = endY - startY;
  const lengthSquared = dx * dx + dy * dy;
  const progress =
    lengthSquared === 0
      ? 0
      : clamp(((pointX - startX) * dx + (pointY - startY) * dy) / lengthSquared, 0, 1);

  return Math.hypot(pointX - (startX + progress * dx), pointY - (startY + progress * dy));
}

export function thinPoints(flat: number[], minDistance: number): number[] {
  const kept: number[] = [];
  let lastX = Infinity;
  let lastY = Infinity;

  for (let i = 0; i < flat.length; i += 2) {
    const isLastPoint = i >= flat.length - 2;
    const tooClose = Math.abs(flat[i] - lastX) + Math.abs(flat[i + 1] - lastY) < minDistance;
    if (tooClose && !isLastPoint) continue;

    kept.push(flat[i], flat[i + 1]);
    lastX = flat[i];
    lastY = flat[i + 1];
  }

  return kept;
}

import { SPACE } from "../projection";
import { TRAIL_PICK_REACH_PX } from "./constants";
import { distanceToSegment } from "./math";
import type { CameraPosition, TrailModel } from "./types";

export function pickTrail(
  trails: TrailModel[],
  camera: CameraPosition,
  viewWidth: number,
  viewHeight: number,
  screenX: number,
  screenY: number,
): string | null {
  const { x, y, z } = camera;
  const reach = TRAIL_PICK_REACH_PX;
  const sceneToScreen = z / SPACE;
  const offsetX = viewWidth / 2 - x * z;
  const offsetY = viewHeight / 2 - y * z;

  let closestId: string | null = null;
  let closestDistance = reach;

  for (const trail of trails) {
    for (const line of trail.lines) {
      const { bounds, points } = line;
      const isFarAway =
        bounds.maxX * z + offsetX < screenX - reach ||
        bounds.minX * z + offsetX > screenX + reach ||
        bounds.maxY * z + offsetY < screenY - reach ||
        bounds.minY * z + offsetY > screenY + reach;
      if (isFarAway) continue;

      for (let i = 2; i < points.length; i += 2) {
        const distance = distanceToSegment(
          screenX,
          screenY,
          points[i - 2] * sceneToScreen + offsetX,
          points[i - 1] * sceneToScreen + offsetY,
          points[i] * sceneToScreen + offsetX,
          points[i + 1] * sceneToScreen + offsetY,
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestId = trail.id;
        }
      }
    }
  }

  return closestId;
}

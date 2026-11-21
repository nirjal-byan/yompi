import { existsSync } from "node:fs";
import { join } from "node:path";

const TREK_IMAGE_DIRECTORY = "treks";
const FALLBACK_IMAGE_NAME = "hero";

function publicImagePath(name: string): string | null {
  const file = `${name}.jpg`;
  const exists = existsSync(join(process.cwd(), "public", TREK_IMAGE_DIRECTORY, file));

  return exists ? `/${TREK_IMAGE_DIRECTORY}/${file}` : null;
}

export function findTrekImage(slug?: string): string | null {
  return (slug && publicImagePath(slug)) || publicImagePath(FALLBACK_IMAGE_NAME);
}

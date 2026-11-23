import { existsSync } from "node:fs";
import { join } from "node:path";
import { type ImageCredit, TREK_IMAGE_CREDITS } from "../data/trek-images";

const TREK_IMAGE_DIRECTORY = "treks";
const FALLBACK_IMAGE_NAME = "hero";

export interface TrekImage {
  src: string;
  credit: ImageCredit | null;
}

function publicImagePath(name: string): string | null {
  const file = `${name}.jpg`;
  const exists = existsSync(join(process.cwd(), "public", TREK_IMAGE_DIRECTORY, file));

  return exists ? `/${TREK_IMAGE_DIRECTORY}/${file}` : null;
}

export function findTrekImage(slug?: string): TrekImage | null {
  const own = slug ? publicImagePath(slug) : null;
  if (own && slug) return { src: own, credit: TREK_IMAGE_CREDITS[slug] ?? null };

  const fallback = publicImagePath(FALLBACK_IMAGE_NAME);

  return fallback ? { src: fallback, credit: null } : null;
}

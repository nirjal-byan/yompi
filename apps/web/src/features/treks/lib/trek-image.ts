import { existsSync } from "node:fs";
import { join } from "node:path";
import type { TrekPhotoInfo } from "@yompi/shared";
import { API_URL } from "@/lib/config";
import { type ImageCredit, TREK_IMAGE_CREDITS } from "../data/trek-images";

const TREK_IMAGE_DIRECTORY = "treks";
const FALLBACK_IMAGE_NAME = "hero";

export interface TrekImage {
  src: string;
  credit: ImageCredit | null;
  uploaded: boolean;
}

function publicImagePath(name: string): string | null {
  const file = `${name}.jpg`;
  const exists = existsSync(join(process.cwd(), "public", TREK_IMAGE_DIRECTORY, file));

  return exists ? `/${TREK_IMAGE_DIRECTORY}/${file}` : null;
}

function uploadedImage(photo: TrekPhotoInfo): TrekImage {
  const { fileName, author, license, licenseUrl, sourceUrl } = photo;

  return {
    src: `${API_URL}/trek-photos/files/${fileName}`,
    credit: { author, license, licenseUrl, sourceUrl },
    uploaded: true,
  };
}

export function findTrekImage(slug: string, uploads: TrekPhotoInfo[]): TrekImage | null {
  const upload = uploads.find((photo) => photo.trekSlug === slug);
  if (upload) return uploadedImage(upload);

  const own = publicImagePath(slug);
  if (own) return { src: own, credit: TREK_IMAGE_CREDITS[slug] ?? null, uploaded: false };

  const fallback = publicImagePath(FALLBACK_IMAGE_NAME);

  return fallback ? { src: fallback, credit: null, uploaded: false } : null;
}

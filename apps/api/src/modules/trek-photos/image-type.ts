export interface ImageType {
  extension: "jpg" | "png" | "webp";
  mimeType: string;
}

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export const MIME_BY_EXTENSION: Record<ImageType["extension"], string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const asType = (extension: ImageType["extension"]): ImageType => ({
  extension,
  mimeType: MIME_BY_EXTENSION[extension],
});

export function detectImageType(buffer: Buffer): ImageType | null {
  if (buffer.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC)) return asType("jpg");
  if (buffer.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) return asType("png");

  const isWebp =
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP";

  return isWebp ? asType("webp") : null;
}

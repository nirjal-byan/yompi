import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PhotoCreditSchema, type TrekPhotoInfo, validateRow } from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { failValidation } from "../admin/admin.errors.js";
import { MIME_BY_EXTENSION, type ImageType, detectImageType } from "./image-type.js";
import { PhotoStorage } from "./photo-storage.js";

export interface UploadedPhoto {
  buffer: Buffer;
}

@Injectable()
export class TrekPhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: PhotoStorage,
  ) {}

  async list(): Promise<TrekPhotoInfo[]> {
    const photos = await this.prisma.client.trekPhoto.findMany({
      include: { trek: { select: { slug: true } } },
    });

    return photos.map(({ trek, fileName, author, license, licenseUrl, sourceUrl }) => ({
      trekSlug: trek.slug,
      fileName,
      author,
      license,
      licenseUrl,
      sourceUrl,
    }));
  }

  async readFile(fileName: string) {
    const content = await this.storage.read(fileName);
    if (!content) throw new NotFoundException("Photo not found");

    const extension = fileName.split(".").pop() as ImageType["extension"];

    return { content, mimeType: MIME_BY_EXTENSION[extension] };
  }

  async set(slug: string, file: UploadedPhoto | undefined, body: unknown): Promise<void> {
    const credit = validateRow(PhotoCreditSchema, body);
    if (!credit.ok) return failValidation(credit.errors);

    const type = file && detectImageType(file.buffer);
    if (!file || !type) throw new BadRequestException("Upload a JPEG, PNG or WebP image.");

    const trekId = await this.findTrekId(slug);
    const previous = await this.prisma.client.trekPhoto.findUnique({ where: { trekId } });
    const fileName = await this.storage.save(file.buffer, type.extension);
    const data = {
      fileName,
      author: credit.data.author,
      license: credit.data.license,
      licenseUrl: credit.data.licenseUrl ?? null,
      sourceUrl: credit.data.sourceUrl ?? null,
    };

    await this.prisma.client.trekPhoto.upsert({
      where: { trekId },
      update: data,
      create: { ...data, trekId },
    });
    if (previous) await this.storage.remove(previous.fileName);
  }

  async remove(slug: string): Promise<void> {
    const trekId = await this.findTrekId(slug);
    const photo = await this.prisma.client.trekPhoto.findUnique({ where: { trekId } });
    if (!photo) return;

    await this.prisma.client.trekPhoto.delete({ where: { trekId } });
    await this.storage.remove(photo.fileName);
  }

  private async findTrekId(slug: string): Promise<string> {
    const trek = await this.prisma.client.trek.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!trek) throw new NotFoundException("Trek not found");

    return trek.id;
  }
}

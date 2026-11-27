import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";

@Injectable()
export class SavedTreksService {
  constructor(private readonly prisma: PrismaService) {}

  async listSlugs(userId: string): Promise<string[]> {
    const saved = await this.prisma.client.savedTrek.findMany({
      where: { userId },
      select: { trek: { select: { slug: true } } },
      orderBy: { createdAt: "desc" },
    });

    return saved.map(({ trek }) => trek.slug);
  }

  async save(userId: string, slug: string): Promise<void> {
    const trekId = await this.findTrekId(slug);

    await this.prisma.client.savedTrek.upsert({
      where: { userId_trekId: { userId, trekId } },
      update: {},
      create: { userId, trekId },
    });
  }

  async remove(userId: string, slug: string): Promise<void> {
    const trekId = await this.findTrekId(slug);

    await this.prisma.client.savedTrek.deleteMany({ where: { userId, trekId } });
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

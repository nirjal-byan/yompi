import { Injectable } from "@nestjs/common";
import { CONDITION_STALE_AFTER_DAYS, type ConditionInfo } from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";

const MS_PER_DAY = 86_400_000;

export function isConditionStale(verifiedAt: Date, now = new Date()): boolean {
  return now.getTime() - verifiedAt.getTime() > CONDITION_STALE_AFTER_DAYS * MS_PER_DAY;
}

@Injectable()
export class ConditionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<ConditionInfo[]> {
    const conditions = await this.prisma.client.condition.findMany({
      include: { trek: { select: { slug: true, name: true } } },
      orderBy: [{ verifiedAt: "desc" }, { title: "asc" }],
    });

    return conditions.map((condition) => ({
      slug: condition.slug,
      title: condition.title,
      summary: condition.summary,
      category: condition.category,
      trekSlug: condition.trek?.slug ?? null,
      trekName: condition.trek?.name ?? null,
      source: {
        name: condition.sourceName,
        url: condition.sourceUrl,
        verifiedAt: condition.verifiedAt.toISOString().slice(0, 10),
        stale: isConditionStale(condition.verifiedAt),
      },
    }));
  }
}

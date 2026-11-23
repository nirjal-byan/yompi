import { Injectable } from "@nestjs/common";
import { type StayInfo, isStale } from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";

@Injectable()
export class StaysService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<StayInfo[]> {
    const stays = await this.prisma.client.stay.findMany({
      include: { trek: { select: { slug: true, name: true, region: true } } },
      orderBy: [{ trek: { name: "asc" } }, { name: "asc" }],
    });

    return stays.map(({ trek, sourceName, sourceUrl, verifiedAt, ...stay }) => ({
      slug: stay.slug,
      name: stay.name,
      place: stay.place,
      trekSlug: trek.slug,
      trekName: trek.name,
      region: trek.region,
      tier: stay.tier,
      pricePerNightNpr: stay.pricePerNightNpr,
      elevationM: stay.elevationM,
      notes: stay.notes,
      source: {
        name: sourceName,
        url: sourceUrl,
        verifiedAt: verifiedAt.toISOString().slice(0, 10),
        stale: isStale(verifiedAt),
      },
    }));
  }
}

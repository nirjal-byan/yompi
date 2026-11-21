import { Injectable } from "@nestjs/common";
import {
  type CostCategory,
  type CostInfo,
  type CostUnit,
  type PermitInfo,
  type PermitUnit,
  type SourceCitation,
  type TrekInfo,
  type TrekSummary,
  isStale,
} from "@yompi/shared";
import { PrismaService } from "../../infrastructure/database/prisma.service.js";
import { estimateDifficulty } from "./difficulty.js";

interface SourceColumns {
  sourceName: string;
  sourceUrl: string;
  verifiedAt: Date;
}

interface TrekRow extends SourceColumns {
  id: string;
  slug: string;
  name: string;
  region: string;
  minDays: number;
  maxDays: number;
  highestPointM: number | null;
  startPlace: string | null;
  endPlace: string | null;
  notes: string | null;
}

interface PermitRow extends SourceColumns {
  name: string;
  authority: string;
  appliesTo: string;
  amountNpr: number;
  unit: PermitUnit;
  notes: string | null;
}

interface CostRow extends SourceColumns {
  category: CostCategory;
  label: string;
  amountNpr: number;
  unit: CostUnit;
  trekId: string | null;
  notes: string | null;
}

export interface TrekContext {
  profileHighestM: number | null;

  highPassCount: number;
}

@Injectable()
export class TreksService {
  constructor(private readonly prisma: PrismaService) {}

  listSummaries(): Promise<TrekSummary[]> {
    return this.prisma.client.trek.findMany({
      select: {
        slug: true,
        name: true,
        region: true,
        minDays: true,
        maxDays: true,
        highestPointM: true,
        startPlace: true,
        endPlace: true,
        trailId: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async findByTrailId(trailId: string, context: TrekContext): Promise<TrekInfo | null> {
    const db = this.prisma.client;
    const treks = await db.$queryRaw<TrekRow[]>`
      SELECT id, slug, name, region, "minDays", "maxDays", "highestPointM", "startPlace", "endPlace", notes,
             "sourceName", "sourceUrl", "verifiedAt"
      FROM "Trek" WHERE "trailId" = ${trailId} LIMIT 1`;
    if (treks.length === 0) return null;
    const trek = treks[0];

    const permits = await db.$queryRaw<PermitRow[]>`
      SELECT p.name, p.authority, p."appliesTo", p."amountNpr", p.unit::text AS unit, p.notes,
             p."sourceName", p."sourceUrl", p."verifiedAt"
      FROM "Permit" p JOIN "TrekPermit" tp ON tp."permitId" = p.id
      WHERE tp."trekId" = ${trek.id} ORDER BY p.name`;
    const costs = await db.$queryRaw<CostRow[]>`
      SELECT category::text AS category, label, "amountNpr", unit::text AS unit, "trekId", notes,
             "sourceName", "sourceUrl", "verifiedAt"
      FROM "CostItem" WHERE "trekId" = ${trek.id} OR "trekId" IS NULL
      ORDER BY category, label`;

    return {
      slug: trek.slug,
      name: trek.name,
      region: trek.region,
      minDays: trek.minDays,
      maxDays: trek.maxDays,
      highestPointM: trek.highestPointM,
      startPlace: trek.startPlace,
      endPlace: trek.endPlace,
      notes: trek.notes,
      source: citation(trek),
      permits: permits.map(toPermit),
      costs: preferSpecific(costs.map((row) => toCost(row, trek.id))),
      difficulty: estimateDifficulty({
        highestPointM: trek.highestPointM ?? context.profileHighestM,
        maxDays: trek.maxDays,
        highPassCount: context.highPassCount,
      }),
    };
  }
}

function citation(row: SourceColumns): SourceCitation {
  return {
    name: row.sourceName,
    url: row.sourceUrl,
    verifiedAt: row.verifiedAt.toISOString().slice(0, 10),
    stale: isStale(row.verifiedAt),
  };
}

function toPermit(row: PermitRow): PermitInfo {
  return {
    name: row.name,
    authority: row.authority,
    appliesTo: row.appliesTo,
    amountNpr: row.amountNpr,
    unit: row.unit,
    notes: row.notes,
    source: citation(row),
  };
}

function toCost(row: CostRow, trekId: string): CostInfo {
  return {
    category: row.category,
    label: row.label,
    amountNpr: row.amountNpr,
    unit: row.unit,
    specific: row.trekId === trekId,
    notes: row.notes,
    source: citation(row),
  };
}

export function preferSpecific(costs: CostInfo[]): CostInfo[] {
  const specific = new Set(costs.filter((c) => c.specific).map((c) => c.category));
  return costs.filter((c) => c.specific || !specific.has(c.category));
}

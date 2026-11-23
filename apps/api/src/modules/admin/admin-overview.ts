import {
  type AdminOverview,
  type AdminResource,
  type AttentionItem,
  type CostRecord,
  type PermitRecord,
  type StayRecord,
  type TrekRecord,
  isStale,
} from "@yompi/shared";
import type { Database } from "./resources/resource-definition.js";

interface Records {
  treks: TrekRecord[];
  permits: PermitRecord[];
  costs: CostRecord[];
  stays: StayRecord[];
}

async function findTrailsWithoutTrek(db: Database): Promise<AttentionItem[]> {
  const trails = await db.$queryRaw<{ name: string }[]>`
    SELECT name FROM "GeoFeature"
    WHERE kind = 'TRAIL' AND id NOT IN (SELECT "trailId" FROM "Trek" WHERE "trailId" IS NOT NULL)
    ORDER BY name`;

  return trails.map((trail) => ({
    resource: "treks",
    slug: null,
    label: trail.name,
    message: "This trail is on the map but has no trek details yet.",
  }));
}

function findTreksWithoutPermit({ treks, permits }: Records): AttentionItem[] {
  const treksWithPermit = new Set(permits.flatMap((permit) => permit.trekSlugs));

  return treks
    .filter((trek) => !treksWithPermit.has(trek.slug))
    .map((trek) => ({
      resource: "treks",
      slug: trek.slug,
      label: trek.name,
      message: "No permit added for this trek.",
    }));
}

function findStale<T extends { slug: string; verifiedAt: string }>(
  resource: AdminResource,
  rows: T[],
  labelOf: (row: T) => string,
): AttentionItem[] {
  return rows
    .filter((row) => isStale(row.verifiedAt))
    .map((row) => ({
      resource,
      slug: row.slug,
      label: labelOf(row),
      message: `Last checked ${row.verifiedAt}. Worth re-checking.`,
    }));
}

export async function buildOverview(db: Database, records: Records): Promise<AdminOverview> {
  const { treks, permits, costs, stays } = records;

  const attention = [
    ...(await findTrailsWithoutTrek(db)),
    ...findTreksWithoutPermit(records),
    ...findStale("treks", treks, (trek) => trek.name),
    ...findStale("permits", permits, (permit) => permit.name),
    ...findStale("costs", costs, (cost) => cost.label),
    ...findStale("stays", stays, (stay) => stay.name),
  ];

  return {
    counts: {
      treks: treks.length,
      permits: permits.length,
      costs: costs.length,
      stays: stays.length,
    },
    attention,
  };
}

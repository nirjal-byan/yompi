import type { Database } from "./resource-definition.js";

export async function listTrailNames(db: Database): Promise<string[]> {
  const rows = await db.$queryRaw<
    { name: string }[]
  >`SELECT name FROM "GeoFeature" WHERE kind = 'TRAIL' ORDER BY name`;

  return rows.map((row) => row.name);
}

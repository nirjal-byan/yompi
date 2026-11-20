import { Prisma } from "@yompi/database";
import { type CostRecord, type CostRow, CostRowSchema, validateRow } from "@yompi/shared";
import { failValidation, fieldError } from "../admin.errors.js";
import { formatDate } from "../sql.js";
import type { Database, ResourceDefinition } from "./resource-definition.js";

export function createCostResource(db: Database): ResourceDefinition<CostRecord, CostRow> {
  function select(slug?: string) {
    const where = slug ? Prisma.sql`WHERE c.slug = ${slug}` : Prisma.empty;

    return db.$queryRaw<CostRecord[]>`
      SELECT c.slug, c.category::text AS category, c.label, c."amountNpr", c.unit::text AS unit, t.slug AS "trekSlug", c.notes,
             c."sourceName", c."sourceUrl", ${formatDate('c."verifiedAt"')} AS "verifiedAt"
      FROM "CostItem" c LEFT JOIN "Trek" t ON t.id = c."trekId"
      ${where}
      ORDER BY c.category, c.label`;
  }

  async function parse(body: unknown): Promise<CostRow> {
    const result = validateRow(CostRowSchema, body);
    if (!result.ok) return failValidation(result.errors);

    const cost = result.data;
    if (cost.trekSlug) {
      const trek = await db.$queryRaw<
        { found: number }[]
      >`SELECT 1 AS found FROM "Trek" WHERE slug = ${cost.trekSlug}`;
      if (trek.length === 0)
        failValidation([fieldError("trekSlug", `Unknown trek: ${cost.trekSlug}`)]);
    }

    return cost;
  }

  async function save(cost: CostRow): Promise<void> {
    await db.$executeRaw`
      INSERT INTO "CostItem" (id, slug, category, label, "amountNpr", unit, "trekId", notes, "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${cost.slug}, ${cost.category}::"CostCategory", ${cost.label}, ${cost.amountNpr}::int,
              ${cost.unit}::"CostUnit", (SELECT id FROM "Trek" WHERE slug = ${cost.trekSlug ?? null}::text),
              ${cost.notes ?? null}::text, ${cost.sourceName}, ${cost.sourceUrl}, ${cost.verifiedAt}::timestamp, now(), now())
      ON CONFLICT (slug) DO UPDATE SET category = EXCLUDED.category, label = EXCLUDED.label, "amountNpr" = EXCLUDED."amountNpr",
        unit = EXCLUDED.unit, "trekId" = EXCLUDED."trekId", notes = EXCLUDED.notes, "sourceName" = EXCLUDED."sourceName",
        "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
  }

  return {
    table: "CostItem",
    label: "Cost",
    list: () => select(),
    find: async (slug) => (await select(slug))[0],
    parse,
    save,
  };
}

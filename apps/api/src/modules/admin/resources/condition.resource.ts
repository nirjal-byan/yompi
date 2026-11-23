import { Prisma } from "@yompi/database";
import {
  type ConditionRecord,
  type ConditionRow,
  ConditionRowSchema,
  validateRow,
} from "@yompi/shared";
import { failValidation, fieldError } from "../admin.errors.js";
import { formatDate } from "../sql.js";
import type { Database, ResourceDefinition } from "./resource-definition.js";

export function createConditionResource(
  db: Database,
): ResourceDefinition<ConditionRecord, ConditionRow> {
  function select(slug?: string) {
    const where = slug ? Prisma.sql`WHERE c.slug = ${slug}` : Prisma.empty;

    return db.$queryRaw<ConditionRecord[]>`
      SELECT c.slug, c.title, c.summary, c.category::text AS category, t.slug AS "trekSlug",
             c."sourceName", c."sourceUrl", ${formatDate('c."verifiedAt"')} AS "verifiedAt"
      FROM "Condition" c LEFT JOIN "Trek" t ON t.id = c."trekId"
      ${where}
      ORDER BY c."verifiedAt" DESC, c.title`;
  }

  async function parse(body: unknown): Promise<ConditionRow> {
    const result = validateRow(ConditionRowSchema, body);
    if (!result.ok) return failValidation(result.errors);

    const condition = result.data;
    if (condition.trekSlug) {
      const trek = await db.$queryRaw<
        { found: number }[]
      >`SELECT 1 AS found FROM "Trek" WHERE slug = ${condition.trekSlug}`;
      if (trek.length === 0) {
        failValidation([fieldError("trekSlug", `Unknown trek: ${condition.trekSlug}`)]);
      }
    }

    return condition;
  }

  async function save(condition: ConditionRow): Promise<void> {
    await db.$executeRaw`
      INSERT INTO "Condition" (id, slug, title, summary, category, "trekId", "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${condition.slug}, ${condition.title}, ${condition.summary},
              ${condition.category}::"ConditionCategory", (SELECT id FROM "Trek" WHERE slug = ${condition.trekSlug ?? null}::text),
              ${condition.sourceName}, ${condition.sourceUrl}, ${condition.verifiedAt}::timestamp, now(), now())
      ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, summary = EXCLUDED.summary, category = EXCLUDED.category,
        "trekId" = EXCLUDED."trekId", "sourceName" = EXCLUDED."sourceName", "sourceUrl" = EXCLUDED."sourceUrl",
        "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
  }

  return {
    table: "Condition",
    label: "Condition",
    list: () => select(),
    find: async (slug) => (await select(slug))[0],
    parse,
    save,
  };
}

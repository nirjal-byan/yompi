import { Prisma } from "@yompi/database";
import { type StayRecord, type StayRow, StayRowSchema, validateRow } from "@yompi/shared";
import { failValidation, fieldError } from "../admin.errors.js";
import { formatDate } from "../sql.js";
import type { Database, ResourceDefinition } from "./resource-definition.js";

export function createStayResource(db: Database): ResourceDefinition<StayRecord, StayRow> {
  function select(slug?: string) {
    const where = slug ? Prisma.sql`WHERE s.slug = ${slug}` : Prisma.empty;

    return db.$queryRaw<StayRecord[]>`
      SELECT s.slug, s.name, s.place, t.slug AS "trekSlug", s.tier::text AS tier,
             s."pricePerNightNpr", s."elevationM", s.notes, s."sourceName", s."sourceUrl",
             ${formatDate('s."verifiedAt"')} AS "verifiedAt"
      FROM "Stay" s JOIN "Trek" t ON t.id = s."trekId"
      ${where}
      ORDER BY t.name, s.name`;
  }

  async function parse(body: unknown): Promise<StayRow> {
    const result = validateRow(StayRowSchema, body);
    if (!result.ok) return failValidation(result.errors);

    const stay = result.data;
    const trek = await db.$queryRaw<
      { found: number }[]
    >`SELECT 1 AS found FROM "Trek" WHERE slug = ${stay.trekSlug}`;
    if (trek.length === 0) {
      failValidation([fieldError("trekSlug", `Unknown trek: ${stay.trekSlug}`)]);
    }

    return stay;
  }

  async function save(stay: StayRow): Promise<void> {
    await db.$executeRaw`
      INSERT INTO "Stay" (id, slug, name, place, "trekId", tier, "pricePerNightNpr", "elevationM", notes, "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${stay.slug}, ${stay.name}, ${stay.place}, (SELECT id FROM "Trek" WHERE slug = ${stay.trekSlug}),
              ${stay.tier}::"AccommodationTier", ${stay.pricePerNightNpr ?? null}::int, ${stay.elevationM ?? null}::int,
              ${stay.notes ?? null}::text, ${stay.sourceName}, ${stay.sourceUrl}, ${stay.verifiedAt}::timestamp, now(), now())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, place = EXCLUDED.place, "trekId" = EXCLUDED."trekId",
        tier = EXCLUDED.tier, "pricePerNightNpr" = EXCLUDED."pricePerNightNpr", "elevationM" = EXCLUDED."elevationM",
        notes = EXCLUDED.notes, "sourceName" = EXCLUDED."sourceName", "sourceUrl" = EXCLUDED."sourceUrl",
        "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
  }

  return {
    table: "Stay",
    label: "Stay",
    list: () => select(),
    find: async (slug) => (await select(slug))[0],
    parse,
    save,
  };
}

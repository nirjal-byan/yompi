import { Prisma } from "@yompi/database";
import { type PermitRecord, type PermitRow, PermitRowSchema, validateRow } from "@yompi/shared";
import { failValidation, fieldError } from "../admin.errors.js";
import { formatDate } from "../sql.js";
import type { Database, ResourceDefinition } from "./resource-definition.js";

function withJoinedTrekSlugs(body: unknown): Record<string, unknown> {
  const input = body && typeof body === "object" ? { ...(body as Record<string, unknown>) } : {};
  if (Array.isArray(input.trekSlugs)) input.trekSlugs = input.trekSlugs.join(";");

  return input;
}

export function createPermitResource(db: Database): ResourceDefinition<PermitRecord, PermitRow> {
  function select(slug?: string) {
    const where = slug ? Prisma.sql`WHERE p.slug = ${slug}` : Prisma.empty;

    return db.$queryRaw<PermitRecord[]>`
      SELECT p.slug, p.name, p.authority, p."appliesTo", p."amountNpr", p.unit::text AS unit, p.notes,
             p."sourceName", p."sourceUrl", ${formatDate('p."verifiedAt"')} AS "verifiedAt",
             COALESCE(array_agg(t.slug ORDER BY t.slug) FILTER (WHERE t.slug IS NOT NULL), ARRAY[]::text[]) AS "trekSlugs"
      FROM "Permit" p
      LEFT JOIN "TrekPermit" tp ON tp."permitId" = p.id
      LEFT JOIN "Trek" t ON t.id = tp."trekId"
      ${where}
      GROUP BY p.id
      ORDER BY p.name`;
  }

  async function parse(body: unknown): Promise<PermitRow> {
    const result = validateRow(PermitRowSchema, withJoinedTrekSlugs(body));
    if (!result.ok) return failValidation(result.errors);

    const permit = result.data;
    const known = await db.$queryRaw<
      { slug: string }[]
    >`SELECT slug FROM "Trek" WHERE slug = ANY(${permit.trekSlugs}::text[])`;
    const knownSlugs = new Set(known.map((trek) => trek.slug));
    const missing = permit.trekSlugs.filter((slug) => !knownSlugs.has(slug));

    if (missing.length > 0) {
      failValidation([fieldError("trekSlugs", `Unknown trek: ${missing.join(", ")}`)]);
    }

    return permit;
  }

  async function save(permit: PermitRow): Promise<void> {
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "Permit" (id, slug, name, authority, "appliesTo", "amountNpr", unit, notes, "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${permit.slug}, ${permit.name}, ${permit.authority}, ${permit.appliesTo},
                ${permit.amountNpr}::int, ${permit.unit}::"PermitUnit", ${permit.notes ?? null}::text,
                ${permit.sourceName}, ${permit.sourceUrl}, ${permit.verifiedAt}::timestamp, now(), now())
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, authority = EXCLUDED.authority, "appliesTo" = EXCLUDED."appliesTo",
          "amountNpr" = EXCLUDED."amountNpr", unit = EXCLUDED.unit, notes = EXCLUDED.notes, "sourceName" = EXCLUDED."sourceName",
          "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;

      await tx.$executeRaw`DELETE FROM "TrekPermit" WHERE "permitId" = (SELECT id FROM "Permit" WHERE slug = ${permit.slug})`;

      for (const trekSlug of permit.trekSlugs) {
        await tx.$executeRaw`
          INSERT INTO "TrekPermit" ("trekId", "permitId")
          SELECT t.id, p.id FROM "Trek" t, "Permit" p WHERE t.slug = ${trekSlug} AND p.slug = ${permit.slug}`;
      }
    });
  }

  return {
    table: "Permit",
    label: "Permit",
    list: () => select(),
    find: async (slug) => (await select(slug))[0],
    parse,
    save,
  };
}

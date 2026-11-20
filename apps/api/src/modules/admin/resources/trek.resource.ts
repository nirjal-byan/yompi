import { Prisma } from "@yompi/database";
import {
  type FieldError,
  type TrekRecord,
  type TrekRow,
  TrekRowSchema,
  validateRow,
} from "@yompi/shared";
import { failValidation, fieldError } from "../admin.errors.js";
import { formatDate } from "../sql.js";
import type { Database, ResourceDefinition } from "./resource-definition.js";
import { listTrailNames } from "./trails.js";

function readTrailName(body: unknown): string {
  const value =
    body && typeof body === "object" ? (body as Record<string, unknown>).trailName : undefined;

  return typeof value === "string" ? value.trim() : "";
}

export function createTrekResource(db: Database): ResourceDefinition<TrekRecord, TrekRow> {
  function select(slug?: string) {
    const where = slug ? Prisma.sql`WHERE t.slug = ${slug}` : Prisma.empty;

    return db.$queryRaw<TrekRecord[]>`
      SELECT t.slug, t.name, t.region, g.name AS "trailName", t."minDays", t."maxDays", t."highestPointM",
             t."startPlace", t."endPlace", t.notes, t."sourceName", t."sourceUrl",
             ${formatDate('t."verifiedAt"')} AS "verifiedAt"
      FROM "Trek" t LEFT JOIN "GeoFeature" g ON g.id = t."trailId"
      ${where}
      ORDER BY t.name`;
  }

  async function parse(body: unknown): Promise<TrekRow> {
    const result = validateRow(TrekRowSchema, body);
    const errors: FieldError[] = result.ok ? [] : [...result.errors];

    const trailName = readTrailName(body);
    if (trailName) {
      const trails = await listTrailNames(db);
      if (!trails.includes(trailName)) {
        errors.push(
          fieldError("trailName", `Not a trail on the map. Choose one of: ${trails.join(", ")}`),
        );
      }
    }

    if (!result.ok || errors.length > 0) return failValidation(errors);
    return result.data;
  }

  async function save(trek: TrekRow): Promise<void> {
    await db.$executeRaw`
      INSERT INTO "Trek" (id, slug, name, region, "trailId", "minDays", "maxDays", "highestPointM", "startPlace", "endPlace", notes,
                          "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${trek.slug}, ${trek.name}, ${trek.region},
              (SELECT id FROM "GeoFeature" WHERE kind = 'TRAIL' AND name = ${trek.trailName ?? null}::text LIMIT 1),
              ${trek.minDays}::int, ${trek.maxDays}::int, ${trek.highestPointM ?? null}::int,
              ${trek.startPlace ?? null}::text, ${trek.endPlace ?? null}::text, ${trek.notes ?? null}::text,
              ${trek.sourceName}, ${trek.sourceUrl}, ${trek.verifiedAt}::timestamp, now(), now())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, "trailId" = EXCLUDED."trailId",
        "minDays" = EXCLUDED."minDays", "maxDays" = EXCLUDED."maxDays", "highestPointM" = EXCLUDED."highestPointM",
        "startPlace" = EXCLUDED."startPlace", "endPlace" = EXCLUDED."endPlace", notes = EXCLUDED.notes,
        "sourceName" = EXCLUDED."sourceName", "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
  }

  return {
    table: "Trek",
    label: "Trek",
    list: () => select(),
    find: async (slug) => (await select(slug))[0],
    parse,
    save,
  };
}

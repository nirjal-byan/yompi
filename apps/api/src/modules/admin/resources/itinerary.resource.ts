import { Prisma } from "@yompi/database";
import {
  type ItineraryDayRecord,
  type ItineraryDayRow,
  ItineraryDayRowSchema,
  validateRow,
} from "@yompi/shared";
import { failValidation, fieldError } from "../admin.errors.js";
import { formatDate } from "../sql.js";
import type { Database, ResourceDefinition } from "./resource-definition.js";

export function createItineraryResource(
  db: Database,
): ResourceDefinition<ItineraryDayRecord, ItineraryDayRow> {
  function select(slug?: string) {
    const where = slug ? Prisma.sql`WHERE d.slug = ${slug}` : Prisma.empty;

    return db.$queryRaw<ItineraryDayRecord[]>`
      SELECT d.slug, t.slug AS "trekSlug", d."dayNumber", d.title, d."fromPlace", d."toPlace",
             d."overnightPlace", d."overnightElevationM", d."hoursText", d.notes,
             d."sourceName", d."sourceUrl", ${formatDate('d."verifiedAt"')} AS "verifiedAt"
      FROM "ItineraryDay" d JOIN "Trek" t ON t.id = d."trekId"
      ${where}
      ORDER BY t.name, d."dayNumber"`;
  }

  async function parse(body: unknown): Promise<ItineraryDayRow> {
    const result = validateRow(ItineraryDayRowSchema, body);
    if (!result.ok) return failValidation(result.errors);

    const day = result.data;
    const trek = await db.$queryRaw<
      { found: number }[]
    >`SELECT 1 AS found FROM "Trek" WHERE slug = ${day.trekSlug}`;
    if (trek.length === 0) {
      failValidation([fieldError("trekSlug", `Unknown trek: ${day.trekSlug}`)]);
    }

    return day;
  }

  async function save(day: ItineraryDayRow): Promise<void> {
    await db.$executeRaw`
      INSERT INTO "ItineraryDay" (id, slug, "trekId", "dayNumber", title, "fromPlace", "toPlace", "overnightPlace", "overnightElevationM", "hoursText", notes, "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${day.slug}, (SELECT id FROM "Trek" WHERE slug = ${day.trekSlug}), ${day.dayNumber}::int,
              ${day.title}, ${day.fromPlace}, ${day.toPlace}, ${day.overnightPlace ?? null}::text, ${day.overnightElevationM ?? null}::int,
              ${day.hoursText ?? null}::text, ${day.notes ?? null}::text, ${day.sourceName}, ${day.sourceUrl},
              ${day.verifiedAt}::timestamp, now(), now())
      ON CONFLICT (slug) DO UPDATE SET "trekId" = EXCLUDED."trekId", "dayNumber" = EXCLUDED."dayNumber", title = EXCLUDED.title,
        "fromPlace" = EXCLUDED."fromPlace", "toPlace" = EXCLUDED."toPlace", "overnightPlace" = EXCLUDED."overnightPlace",
        "overnightElevationM" = EXCLUDED."overnightElevationM", "hoursText" = EXCLUDED."hoursText", notes = EXCLUDED.notes,
        "sourceName" = EXCLUDED."sourceName", "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt",
        "updatedAt" = now()`;
  }

  return {
    table: "ItineraryDay",
    label: "Itinerary day",
    list: () => select(),
    find: async (slug) => (await select(slug))[0],
    parse,
    save,
  };
}

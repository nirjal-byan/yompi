import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@yompi/database';
import {
  type AdminOverview,
  type AttentionItem,
  type CostRecord,
  CostRowSchema,
  type FieldError,
  type PermitRecord,
  PermitRowSchema,
  type TrekRecord,
  TrekRowSchema,
  isStale,
  validateRow,
} from '@yompi/shared';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = `to_char(%s, 'YYYY-MM-DD')`;

const fail = (errors: FieldError[]): never => {
  throw new BadRequestException({ errors });
};

/**
 * Create, read, update and delete for treks, permits and costs. All input goes through the same
 * validation rules as the CSV importer, so a record without a source can never be saved. Uses SQL
 * directly (like the rest of the data code) so it works without regenerating the Prisma client.
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  private get db() {
    return this.prisma.client;
  }

  assertSlug(slug: string): void {
    if (!SLUG.test(slug)) throw new BadRequestException('Invalid id');
  }

  // ---------------------------------------------------------------- lookups for the forms

  async trailNames(): Promise<string[]> {
    const rows = await this.db.$queryRaw<{ name: string }[]>`SELECT name FROM "GeoFeature" WHERE kind = 'TRAIL' ORDER BY name`;
    return rows.map((r) => r.name);
  }

  // ---------------------------------------------------------------- treks

  private selectTreks(slug?: string) {
    const where = slug ? Prisma.sql`WHERE t.slug = ${slug}` : Prisma.empty;
    return this.db.$queryRaw<TrekRecord[]>`
      SELECT t.slug, t.name, t.region, g.name AS "trailName", t."minDays", t."maxDays", t."highestPointM",
             t."startPlace", t."endPlace", t.notes, t."sourceName", t."sourceUrl",
             ${Prisma.raw(DATE.replace('%s', 't."verifiedAt"'))} AS "verifiedAt"
      FROM "Trek" t LEFT JOIN "GeoFeature" g ON g.id = t."trailId"
      ${where}
      ORDER BY t.name`;
  }

  listTreks(): Promise<TrekRecord[]> {
    return this.selectTreks();
  }

  async getTrek(slug: string): Promise<TrekRecord> {
    const [row] = await this.selectTreks(slug);
    if (!row) throw new NotFoundException('Trek not found');
    return row;
  }

  async createTrek(body: unknown): Promise<TrekRecord> {
    const row = await this.validTrek(body);
    if (await this.exists('Trek', row.slug)) fail([{ field: 'slug', message: 'This id is already used. Pick another one.' }]);
    await this.writeTrek(row);
    return this.getTrek(row.slug);
  }

  async updateTrek(slug: string, body: unknown): Promise<TrekRecord> {
    this.assertSlug(slug);
    if (!(await this.exists('Trek', slug))) throw new NotFoundException('Trek not found');
    const row = await this.validTrek(body);
    if (row.slug !== slug) fail([{ field: 'slug', message: 'The id of an existing trek cannot be changed.' }]);
    await this.writeTrek(row);
    return this.getTrek(slug);
  }

  async deleteTrek(slug: string): Promise<void> {
    this.assertSlug(slug);
    const removed = await this.db.$executeRaw`DELETE FROM "Trek" WHERE slug = ${slug}`;
    if (removed === 0) throw new NotFoundException('Trek not found');
  }

  /** Reports every problem at once: field rules and the trail name, so the form can show all of them. */
  private async validTrek(body: unknown) {
    const result = validateRow(TrekRowSchema, body);
    const errors: FieldError[] = result.ok ? [] : [...result.errors];

    const raw = (body && typeof body === 'object' ? (body as Record<string, unknown>).trailName : undefined);
    const trailName = typeof raw === 'string' ? raw.trim() : '';
    if (trailName) {
      const trails = await this.trailNames();
      if (!trails.includes(trailName)) {
        errors.push({ field: 'trailName', message: `Not a trail on the map. Choose one of: ${trails.join(', ')}` });
      }
    }
    if (!result.ok || errors.length > 0) return fail(errors);
    return result.data;
  }

  private async writeTrek(t: ReturnType<typeof TrekRowSchema.parse>): Promise<void> {
    await this.db.$executeRaw`
      INSERT INTO "Trek" (id, slug, name, region, "trailId", "minDays", "maxDays", "highestPointM", "startPlace", "endPlace", notes,
                          "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${t.slug}, ${t.name}, ${t.region},
              (SELECT id FROM "GeoFeature" WHERE kind = 'TRAIL' AND name = ${t.trailName ?? null}::text LIMIT 1),
              ${t.minDays}::int, ${t.maxDays}::int, ${t.highestPointM ?? null}::int, ${t.startPlace ?? null}::text, ${t.endPlace ?? null}::text,
              ${t.notes ?? null}::text, ${t.sourceName}, ${t.sourceUrl}, ${t.verifiedAt}::timestamp, now(), now())
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, region = EXCLUDED.region, "trailId" = EXCLUDED."trailId",
        "minDays" = EXCLUDED."minDays", "maxDays" = EXCLUDED."maxDays", "highestPointM" = EXCLUDED."highestPointM",
        "startPlace" = EXCLUDED."startPlace", "endPlace" = EXCLUDED."endPlace", notes = EXCLUDED.notes,
        "sourceName" = EXCLUDED."sourceName", "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
  }

  // ---------------------------------------------------------------- permits

  private selectPermits(slug?: string) {
    const where = slug ? Prisma.sql`WHERE p.slug = ${slug}` : Prisma.empty;
    return this.db.$queryRaw<PermitRecord[]>`
      SELECT p.slug, p.name, p.authority, p."appliesTo", p."amountNpr", p.unit::text AS unit, p.notes,
             p."sourceName", p."sourceUrl", ${Prisma.raw(DATE.replace('%s', 'p."verifiedAt"'))} AS "verifiedAt",
             COALESCE(array_agg(t.slug ORDER BY t.slug) FILTER (WHERE t.slug IS NOT NULL), ARRAY[]::text[]) AS "trekSlugs"
      FROM "Permit" p
      LEFT JOIN "TrekPermit" tp ON tp."permitId" = p.id
      LEFT JOIN "Trek" t ON t.id = tp."trekId"
      ${where}
      GROUP BY p.id
      ORDER BY p.name`;
  }

  listPermits(): Promise<PermitRecord[]> {
    return this.selectPermits();
  }

  async getPermit(slug: string): Promise<PermitRecord> {
    const [row] = await this.selectPermits(slug);
    if (!row) throw new NotFoundException('Permit not found');
    return row;
  }

  async createPermit(body: unknown): Promise<PermitRecord> {
    const row = await this.validPermit(body);
    if (await this.exists('Permit', row.slug)) fail([{ field: 'slug', message: 'This id is already used. Pick another one.' }]);
    await this.writePermit(row);
    return this.getPermit(row.slug);
  }

  async updatePermit(slug: string, body: unknown): Promise<PermitRecord> {
    this.assertSlug(slug);
    if (!(await this.exists('Permit', slug))) throw new NotFoundException('Permit not found');
    const row = await this.validPermit(body);
    if (row.slug !== slug) fail([{ field: 'slug', message: 'The id of an existing permit cannot be changed.' }]);
    await this.writePermit(row);
    return this.getPermit(slug);
  }

  async deletePermit(slug: string): Promise<void> {
    this.assertSlug(slug);
    const removed = await this.db.$executeRaw`DELETE FROM "Permit" WHERE slug = ${slug}`;
    if (removed === 0) throw new NotFoundException('Permit not found');
  }

  /** The form sends trekSlugs as a list; the shared schema expects the CSV form (a;b), so join it. */
  private async validPermit(body: unknown) {
    const input = body && typeof body === 'object' ? { ...(body as Record<string, unknown>) } : {};
    if (Array.isArray(input.trekSlugs)) input.trekSlugs = input.trekSlugs.join(';');
    const result = validateRow(PermitRowSchema, input);
    if (!result.ok) return fail(result.errors);
    const row = result.data;
    const known = await this.db.$queryRaw<{ slug: string }[]>`SELECT slug FROM "Trek" WHERE slug = ANY(${row.trekSlugs}::text[])`;
    const missing = row.trekSlugs.filter((slug) => !known.some((k) => k.slug === slug));
    if (missing.length > 0) fail([{ field: 'trekSlugs', message: `Unknown trek: ${missing.join(', ')}` }]);
    return row;
  }

  private async writePermit(p: ReturnType<typeof PermitRowSchema.parse>): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO "Permit" (id, slug, name, authority, "appliesTo", "amountNpr", unit, notes, "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${p.slug}, ${p.name}, ${p.authority}, ${p.appliesTo}, ${p.amountNpr}::int, ${p.unit}::"PermitUnit",
                ${p.notes ?? null}::text, ${p.sourceName}, ${p.sourceUrl}, ${p.verifiedAt}::timestamp, now(), now())
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, authority = EXCLUDED.authority, "appliesTo" = EXCLUDED."appliesTo",
          "amountNpr" = EXCLUDED."amountNpr", unit = EXCLUDED.unit, notes = EXCLUDED.notes, "sourceName" = EXCLUDED."sourceName",
          "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
      await tx.$executeRaw`DELETE FROM "TrekPermit" WHERE "permitId" = (SELECT id FROM "Permit" WHERE slug = ${p.slug})`;
      for (const trekSlug of p.trekSlugs) {
        await tx.$executeRaw`
          INSERT INTO "TrekPermit" ("trekId", "permitId")
          SELECT t.id, p.id FROM "Trek" t, "Permit" p WHERE t.slug = ${trekSlug} AND p.slug = ${p.slug}`;
      }
    });
  }

  // ---------------------------------------------------------------- costs

  private selectCosts(slug?: string) {
    const where = slug ? Prisma.sql`WHERE c.slug = ${slug}` : Prisma.empty;
    return this.db.$queryRaw<CostRecord[]>`
      SELECT c.slug, c.category::text AS category, c.label, c."amountNpr", c.unit::text AS unit, t.slug AS "trekSlug", c.notes,
             c."sourceName", c."sourceUrl", ${Prisma.raw(DATE.replace('%s', 'c."verifiedAt"'))} AS "verifiedAt"
      FROM "CostItem" c LEFT JOIN "Trek" t ON t.id = c."trekId"
      ${where}
      ORDER BY c.category, c.label`;
  }

  listCosts(): Promise<CostRecord[]> {
    return this.selectCosts();
  }

  async getCost(slug: string): Promise<CostRecord> {
    const [row] = await this.selectCosts(slug);
    if (!row) throw new NotFoundException('Cost not found');
    return row;
  }

  async createCost(body: unknown): Promise<CostRecord> {
    const row = await this.validCost(body);
    if (await this.exists('CostItem', row.slug)) fail([{ field: 'slug', message: 'This id is already used. Pick another one.' }]);
    await this.writeCost(row);
    return this.getCost(row.slug);
  }

  async updateCost(slug: string, body: unknown): Promise<CostRecord> {
    this.assertSlug(slug);
    if (!(await this.exists('CostItem', slug))) throw new NotFoundException('Cost not found');
    const row = await this.validCost(body);
    if (row.slug !== slug) fail([{ field: 'slug', message: 'The id of an existing cost cannot be changed.' }]);
    await this.writeCost(row);
    return this.getCost(slug);
  }

  async deleteCost(slug: string): Promise<void> {
    this.assertSlug(slug);
    const removed = await this.db.$executeRaw`DELETE FROM "CostItem" WHERE slug = ${slug}`;
    if (removed === 0) throw new NotFoundException('Cost not found');
  }

  private async validCost(body: unknown) {
    const result = validateRow(CostRowSchema, body);
    if (!result.ok) return fail(result.errors);
    const row = result.data;
    if (row.trekSlug && !(await this.exists('Trek', row.trekSlug))) {
      fail([{ field: 'trekSlug', message: `Unknown trek: ${row.trekSlug}` }]);
    }
    return row;
  }

  private async writeCost(c: ReturnType<typeof CostRowSchema.parse>): Promise<void> {
    await this.db.$executeRaw`
      INSERT INTO "CostItem" (id, slug, category, label, "amountNpr", unit, "trekId", notes, "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${c.slug}, ${c.category}::"CostCategory", ${c.label}, ${c.amountNpr}::int, ${c.unit}::"CostUnit",
              (SELECT id FROM "Trek" WHERE slug = ${c.trekSlug ?? null}::text), ${c.notes ?? null}::text,
              ${c.sourceName}, ${c.sourceUrl}, ${c.verifiedAt}::timestamp, now(), now())
      ON CONFLICT (slug) DO UPDATE SET category = EXCLUDED.category, label = EXCLUDED.label, "amountNpr" = EXCLUDED."amountNpr",
        unit = EXCLUDED.unit, "trekId" = EXCLUDED."trekId", notes = EXCLUDED.notes, "sourceName" = EXCLUDED."sourceName",
        "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
  }

  // ---------------------------------------------------------------- dashboard

  /** Counts plus a to-do list: things to add (trails without details) and things to re-check. */
  async overview(): Promise<AdminOverview> {
    const [treks, permits, costs] = await Promise.all([this.listTreks(), this.listPermits(), this.listCosts()]);
    const unlinked = await this.db.$queryRaw<{ name: string }[]>`
      SELECT name FROM "GeoFeature" WHERE kind = 'TRAIL' AND id NOT IN (SELECT "trailId" FROM "Trek" WHERE "trailId" IS NOT NULL) ORDER BY name`;

    const attention: AttentionItem[] = [];
    for (const trail of unlinked) {
      attention.push({ resource: 'treks', slug: null, label: trail.name, message: 'This trail is on the map but has no trek details yet.' });
    }
    const permitted = new Set(permits.flatMap((p) => p.trekSlugs));
    for (const trek of treks) {
      if (!permitted.has(trek.slug)) attention.push({ resource: 'treks', slug: trek.slug, label: trek.name, message: 'No permit added for this trek.' });
    }
    const stale = (resource: AttentionItem['resource'], rows: { slug: string; verifiedAt: string; name?: string; label?: string }[]) => {
      for (const row of rows) {
        if (isStale(row.verifiedAt)) {
          attention.push({ resource, slug: row.slug, label: row.name ?? row.label ?? row.slug, message: `Last checked ${row.verifiedAt}. Worth re-checking.` });
        }
      }
    };
    stale('treks', treks);
    stale('permits', permits);
    stale('costs', costs);
    return { counts: { treks: treks.length, permits: permits.length, costs: costs.length }, attention };
  }

  // ---------------------------------------------------------------- helpers

  private async exists(table: 'Trek' | 'Permit' | 'CostItem', slug: string): Promise<boolean> {
    // Table names cannot be parameters, so they come from this fixed list only.
    const rows = await this.db.$queryRaw<{ found: number }[]>(Prisma.sql`SELECT 1 AS found FROM ${Prisma.raw(`"${table}"`)} WHERE slug = ${slug}`);
    return rows.length > 0;
  }
}


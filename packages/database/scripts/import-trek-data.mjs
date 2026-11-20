import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { CostRowSchema, PermitRowSchema, TrekRowSchema, isStale } from "@yompi/shared";

const prisma = new PrismaClient();

const DATA_DIR =
  process.env.TREK_DATA_DIR ??
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const DRY_RUN = process.argv.includes("--dry-run") || Boolean(process.env.DRY_RUN);
const PRUNE = process.argv.includes("--prune");

const SOURCE_COLUMNS = ["sourceName", "sourceUrl", "verifiedAt"];
const FILES = {
  treks: {
    file: "treks.csv",
    schema: TrekRowSchema,
    columns: [
      "slug",
      "name",
      "region",
      "trailName",
      "minDays",
      "maxDays",
      "highestPointM",
      "startPlace",
      "endPlace",
      "notes",
      ...SOURCE_COLUMNS,
    ],
  },
  permits: {
    file: "permits.csv",
    schema: PermitRowSchema,
    columns: [
      "slug",
      "name",
      "authority",
      "appliesTo",
      "amountNpr",
      "unit",
      "trekSlugs",
      "notes",
      ...SOURCE_COLUMNS,
    ],
  },
  costs: {
    file: "costs.csv",
    schema: CostRowSchema,
    columns: [
      "slug",
      "category",
      "label",
      "amountNpr",
      "unit",
      "trekSlug",
      "notes",
      ...SOURCE_COLUMNS,
    ],
  },
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^﻿/, "");
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);

function readTable(name) {
  const { file, schema, columns } = FILES[name];
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return null;

  const table = parseCsv(fs.readFileSync(filePath, "utf8")).filter((r) =>
    r.some((c) => c.trim() !== ""),
  );
  if (table.length === 0) {
    fail(`${file}: the file is empty (it needs a header row)`);
    return [];
  }
  const header = table[0].map((h) => h.trim());
  for (const column of columns)
    if (!header.includes(column)) fail(`${file}: missing column "${column}"`);
  for (const column of header)
    if (!columns.includes(column))
      fail(`${file}: unknown column "${column}" (typo? see data/templates/${file})`);
  if (errors.some((e) => e.startsWith(`${file}:`))) return [];

  const rows = [];
  const seen = new Set();
  table.slice(1).forEach((cells, index) => {
    const line = index + 2;
    const raw = Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()]));
    const label = `${file} row ${line}${raw.slug ? ` (${raw.slug})` : ""}`;
    const result = schema.safeParse(raw);
    if (!result.success) {
      const reported = new Set();
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "row";
        if (reported.has(field)) continue;
        reported.add(field);
        fail(`${label}: ${field}: ${issue.message}`);
      }
      return;
    }
    if (seen.has(result.data.slug)) fail(`${label}: duplicate slug "${result.data.slug}"`);
    seen.add(result.data.slug);
    if (isStale(result.data.verifiedAt))
      warnings.push(
        `${label}: verified ${result.data.verifiedAt}, which is over 18 months ago; consider re-checking`,
      );
    rows.push(result.data);
  });
  return rows;
}

async function main() {
  const treks = readTable("treks");
  const permits = readTable("permits");
  const costs = readTable("costs");
  if (!treks && !permits && !costs) {
    console.log(
      `No data files found in ${DATA_DIR}. Copy the templates from data/templates and fill them in (see data/README.md).`,
    );
    return;
  }

  const trailNames = new Set(
    (await prisma.$queryRaw`SELECT name FROM "GeoFeature" WHERE kind = 'TRAIL'`).map((r) => r.name),
  );
  const trekSlugs = treks
    ? new Set(treks.map((t) => t.slug))
    : new Set((await prisma.$queryRaw`SELECT slug FROM "Trek"`).map((r) => r.slug));
  for (const t of treks ?? []) {
    if (t.trailName && !trailNames.has(t.trailName)) {
      fail(
        `treks.csv (${t.slug}): trailName "${t.trailName}" is not an imported trail. Known trails: ${[...trailNames].join(", ")}`,
      );
    }
  }
  for (const p of permits ?? []) {
    for (const slug of p.trekSlugs)
      if (!trekSlugs.has(slug)) fail(`permits.csv (${p.slug}): unknown trek slug "${slug}"`);
  }
  for (const c of costs ?? []) {
    if (c.trekSlug && !trekSlugs.has(c.trekSlug))
      fail(`costs.csv (${c.slug}): unknown trek slug "${c.trekSlug}"`);
  }

  for (const warning of warnings) console.log(`warning: ${warning}`);
  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s) found. Nothing was imported.\n`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  const counts = `${treks?.length ?? "-"} treks, ${permits?.length ?? "-"} permits, ${costs?.length ?? "-"} cost items`;
  if (DRY_RUN) {
    console.log(`Dry run OK: ${counts} are valid. Nothing was written.`);
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      for (const t of treks ?? []) {
        await tx.$executeRaw`
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
      if (PRUNE && treks)
        await tx.$executeRaw`DELETE FROM "Trek" WHERE slug <> ALL(${treks.map((t) => t.slug)}::text[])`;

      for (const p of permits ?? []) {
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
      }
      if (PRUNE && permits)
        await tx.$executeRaw`DELETE FROM "Permit" WHERE slug <> ALL(${permits.map((p) => p.slug)}::text[])`;

      for (const c of costs ?? []) {
        await tx.$executeRaw`
          INSERT INTO "CostItem" (id, slug, category, label, "amountNpr", unit, "trekId", notes, "sourceName", "sourceUrl", "verifiedAt", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${c.slug}, ${c.category}::"CostCategory", ${c.label}, ${c.amountNpr}::int, ${c.unit}::"CostUnit",
                  (SELECT id FROM "Trek" WHERE slug = ${c.trekSlug ?? null}::text), ${c.notes ?? null}::text,
                  ${c.sourceName}, ${c.sourceUrl}, ${c.verifiedAt}::timestamp, now(), now())
          ON CONFLICT (slug) DO UPDATE SET category = EXCLUDED.category, label = EXCLUDED.label, "amountNpr" = EXCLUDED."amountNpr",
            unit = EXCLUDED.unit, "trekId" = EXCLUDED."trekId", notes = EXCLUDED.notes, "sourceName" = EXCLUDED."sourceName",
            "sourceUrl" = EXCLUDED."sourceUrl", "verifiedAt" = EXCLUDED."verifiedAt", "updatedAt" = now()`;
      }
      if (PRUNE && costs)
        await tx.$executeRaw`DELETE FROM "CostItem" WHERE slug <> ALL(${costs.map((c) => c.slug)}::text[])`;
    },
    { timeout: 60_000 },
  );
  console.log(
    `Imported ${counts}.${warnings.length ? ` ${warnings.length} warning(s) above.` : ""}`,
  );
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}

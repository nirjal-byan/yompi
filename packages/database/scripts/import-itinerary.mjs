import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { ItineraryDayRowSchema } from "@yompi/shared";

const prisma = new PrismaClient();

const DATA_FILE =
  process.env.ITINERARY_FILE ??
  path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "itinerary.json");
const DRY_RUN = process.argv.includes("--dry-run");

function readRows() {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const errors = [];
  const rows = [];
  const seenDays = new Set();

  raw.forEach((entry, index) => {
    const label = `itinerary.json entry ${index + 1} (${entry.slug ?? "no slug"})`;
    const result = ItineraryDayRowSchema.safeParse(entry);
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${label}: ${issue.path.join(".") || "row"}: ${issue.message}`);
      }
      return;
    }

    const dayKey = `${result.data.trekSlug}#${result.data.dayNumber}`;
    if (seenDays.has(dayKey)) errors.push(`${label}: duplicate day ${result.data.dayNumber}`);
    seenDays.add(dayKey);
    rows.push(result.data);
  });

  return { rows, errors };
}

async function main() {
  const { rows, errors } = readRows();

  const trekSlugs = new Set(
    (await prisma.trek.findMany({ select: { slug: true } })).map((t) => t.slug),
  );
  for (const row of rows) {
    if (!trekSlugs.has(row.trekSlug)) errors.push(`${row.slug}: unknown trek "${row.trekSlug}"`);
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s) found. Nothing was imported.\n`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  if (DRY_RUN) {
    console.log(`Dry run OK: ${rows.length} itinerary days are valid. Nothing was written.`);
    return;
  }

  for (const row of rows) {
    const { trekSlug, verifiedAt, ...fields } = row;
    const data = {
      ...fields,
      overnightPlace: fields.overnightPlace ?? null,
      overnightElevationM: fields.overnightElevationM ?? null,
      hoursText: fields.hoursText ?? null,
      notes: fields.notes ?? null,
      verifiedAt: new Date(verifiedAt),
    };

    await prisma.itineraryDay.upsert({
      where: { slug: row.slug },
      update: { ...data, trek: { connect: { slug: trekSlug } } },
      create: { ...data, trek: { connect: { slug: trekSlug } } },
    });
  }

  console.log(`Imported ${rows.length} itinerary days.`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}

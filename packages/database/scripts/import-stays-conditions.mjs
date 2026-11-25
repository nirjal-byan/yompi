import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { ConditionRowSchema, SAMPLE_SOURCE_URL, StayRowSchema } from "@yompi/shared";

const prisma = new PrismaClient();

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const DRY_RUN = process.argv.includes("--dry-run");
const REMOVE_SAMPLES = process.argv.includes("--remove-samples");

function readRows(file, schema, errors) {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));

  return raw.flatMap((entry, index) => {
    const result = schema.safeParse(entry);
    if (result.success) return [result.data];

    for (const issue of result.error.issues) {
      errors.push(`${file} entry ${index + 1}: ${issue.path.join(".") || "row"}: ${issue.message}`);
    }

    return [];
  });
}

async function removeSamples() {
  const where = { sourceUrl: SAMPLE_SOURCE_URL };
  const stays = await prisma.stay.deleteMany({ where });
  const conditions = await prisma.condition.deleteMany({ where });
  console.log(`Removed ${stays.count} sample stays and ${conditions.count} sample conditions.`);
}

async function saveStay({ trekSlug, verifiedAt, ...stay }) {
  const data = {
    ...stay,
    pricePerNightNpr: stay.pricePerNightNpr ?? null,
    elevationM: stay.elevationM ?? null,
    notes: stay.notes ?? null,
    verifiedAt: new Date(verifiedAt),
    trek: { connect: { slug: trekSlug } },
  };

  await prisma.stay.upsert({ where: { slug: stay.slug }, update: data, create: data });
}

async function saveCondition({ trekSlug, verifiedAt, ...condition }) {
  const data = { ...condition, verifiedAt: new Date(verifiedAt) };
  const trek = trekSlug ? { connect: { slug: trekSlug } } : undefined;

  await prisma.condition.upsert({
    where: { slug: condition.slug },
    update: { ...data, trek: trek ?? { disconnect: true } },
    create: { ...data, trek },
  });
}

async function main() {
  if (REMOVE_SAMPLES) return removeSamples();

  const errors = [];
  const stays = readRows("stays.json", StayRowSchema, errors);
  const conditions = readRows("conditions.json", ConditionRowSchema, errors);

  const trekSlugs = new Set(
    (await prisma.trek.findMany({ select: { slug: true } })).map((trek) => trek.slug),
  );
  for (const row of [...stays, ...conditions]) {
    if (row.trekSlug && !trekSlugs.has(row.trekSlug)) {
      errors.push(`${row.slug}: unknown trek "${row.trekSlug}"`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n${errors.length} problem(s) found. Nothing was imported.\n`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }

  const counts = `${stays.length} stays and ${conditions.length} conditions`;
  if (DRY_RUN) {
    console.log(`Dry run OK: ${counts} are valid. Nothing was written.`);
    return;
  }

  for (const stay of stays) await saveStay(stay);
  for (const condition of conditions) await saveCondition(condition);
  console.log(`Imported ${counts}.`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}

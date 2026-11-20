import { z } from "zod";

export const PermitUnitSchema = z.enum(["PER_PERSON", "PER_PERSON_PER_DAY", "PER_GROUP"]);
export type PermitUnit = z.infer<typeof PermitUnitSchema>;

export const CostCategorySchema = z.enum([
  "GUIDE_DAILY",
  "PORTER_DAILY",
  "FOOD_DAILY",
  "LODGING_BUDGET",
  "LODGING_STANDARD",
  "LODGING_COMFORT",
  "TRANSPORT",
  "OTHER",
]);
export type CostCategory = z.infer<typeof CostCategorySchema>;

export const CostUnitSchema = z.enum(["PER_DAY", "PER_NIGHT", "PER_PERSON", "PER_TRIP"]);
export type CostUnit = z.infer<typeof CostUnitSchema>;

export const STALE_AFTER_MONTHS = 18;

const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const requiredText = (max = 300) =>
  z.string({ required_error: "required" }).trim().min(1, "required").max(max);
const optionalText = (max = 600) =>
  z.preprocess(blankToUndefined, z.string().trim().max(max).optional());

const slug = z
  .string({ required_error: "required" })
  .trim()
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "use lowercase letters, numbers and dashes, e.g. annapurna-circuit",
  );

const wholeNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (blankToUndefined(value) === undefined ? undefined : Number(value)),
    z
      .number({ required_error: "required", invalid_type_error: "must be a number" })
      .int("must be a whole number")
      .min(min, `must be at least ${min}`)
      .max(max, `must be at most ${max}`),
  );

const optionalWholeNumber = (min: number, max: number) =>
  z.preprocess(
    (value) => (blankToUndefined(value) === undefined ? undefined : Number(value)),
    z
      .number({ invalid_type_error: "must be a number" })
      .int("must be a whole number")
      .min(min)
      .max(max)
      .optional(),
  );

const isoDate = z
  .string({ required_error: "required" })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(value)), "not a real date")
  .refine(
    (value) => Date.parse(value) <= Date.now() + 86_400_000,
    "a verified date cannot be in the future",
  );

const sourceUrl = z
  .string({ required_error: "required" })
  .trim()
  .min(1, "required")
  .url("must be a full link, e.g. https://example.org/page")
  .refine((value) => /^https?:\/\//i.test(value), "must start with http:// or https://");

const sourceFields = {
  sourceName: requiredText(200),
  sourceUrl,
  verifiedAt: isoDate,
};

export const TrekRowSchema = z
  .object({
    slug,
    name: requiredText(120),
    region: requiredText(80),

    trailName: optionalText(200),
    minDays: wholeNumber(1, 60),
    maxDays: wholeNumber(1, 60),

    highestPointM: optionalWholeNumber(100, 9000),
    startPlace: optionalText(120),
    endPlace: optionalText(120),
    notes: optionalText(),
    ...sourceFields,
  })
  .refine((row) => row.maxDays >= row.minDays, {
    message: "maxDays cannot be less than minDays",
    path: ["maxDays"],
  });
export type TrekRow = z.infer<typeof TrekRowSchema>;

export const PermitRowSchema = z.object({
  slug,
  name: requiredText(160),
  authority: requiredText(160),

  appliesTo: requiredText(200),
  amountNpr: wholeNumber(0, 10_000_000),
  unit: PermitUnitSchema,
  notes: optionalText(),

  trekSlugs: z
    .string({ required_error: "required" })
    .trim()
    .min(1, "list at least one trek slug")
    .transform((value) =>
      value
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean),
    )
    .pipe(z.array(slug).min(1, "list at least one trek slug")),
  ...sourceFields,
});
export type PermitRow = z.infer<typeof PermitRowSchema>;

export const CostRowSchema = z.object({
  slug,
  category: CostCategorySchema,
  label: requiredText(160),
  amountNpr: wholeNumber(0, 10_000_000),
  unit: CostUnitSchema,

  trekSlug: z.preprocess(blankToUndefined, slug.optional()),
  notes: optionalText(),
  ...sourceFields,
});
export type CostRow = z.infer<typeof CostRowSchema>;

export function isStale(verifiedAt: string | Date, now = new Date()): boolean {
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - STALE_AFTER_MONTHS);
  return new Date(verifiedAt) < cutoff;
}

export interface SourceCitation {
  name: string;
  url: string;

  verifiedAt: string;

  stale: boolean;
}

export interface PermitInfo {
  name: string;
  authority: string;
  appliesTo: string;
  amountNpr: number;
  unit: PermitUnit;
  notes: string | null;
  source: SourceCitation;
}

export interface CostInfo {
  category: CostCategory;
  label: string;
  amountNpr: number;
  unit: CostUnit;

  specific: boolean;
  notes: string | null;
  source: SourceCitation;
}

export interface DifficultyFactor {
  label: string;
  detail: string;
  points: number;
}

export interface DifficultyEstimate {
  stars: 1 | 2 | 3 | 4 | 5;
  points: number;
  maxPoints: number;
  factors: DifficultyFactor[];
  caveat: string;
}

export interface TrekInfo {
  slug: string;
  name: string;
  region: string;
  minDays: number;
  maxDays: number;
  highestPointM: number | null;
  startPlace: string | null;
  endPlace: string | null;
  notes: string | null;
  source: SourceCitation;
  permits: PermitInfo[];
  costs: CostInfo[];
  difficulty: DifficultyEstimate | null;
}

export interface FieldError {
  field: string;
  message: string;
}

export function validateRow<S extends z.ZodTypeAny>(
  schema: S,
  input: unknown,
): { ok: true; data: z.output<S> } | { ok: false; errors: FieldError[] } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const seen = new Set<string>();
  const errors: FieldError[] = [];
  for (const issue of result.error.issues) {
    const field = issue.path.join(".") || "form";
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({ field, message: issue.message });
  }
  return { ok: false, errors };
}

interface SourcedRecord {
  sourceName: string;
  sourceUrl: string;
  verifiedAt: string;
}

export interface TrekRecord extends SourcedRecord {
  slug: string;
  name: string;
  region: string;
  trailName: string | null;
  minDays: number;
  maxDays: number;
  highestPointM: number | null;
  startPlace: string | null;
  endPlace: string | null;
  notes: string | null;
}

export interface PermitRecord extends SourcedRecord {
  slug: string;
  name: string;
  authority: string;
  appliesTo: string;
  amountNpr: number;
  unit: PermitUnit;
  trekSlugs: string[];
  notes: string | null;
}

export interface CostRecord extends SourcedRecord {
  slug: string;
  category: CostCategory;
  label: string;
  amountNpr: number;
  unit: CostUnit;
  trekSlug: string | null;
  notes: string | null;
}

export const ADMIN_RESOURCES = ["treks", "permits", "costs"] as const;
export type AdminResource = (typeof ADMIN_RESOURCES)[number];

export interface AttentionItem {
  resource: AdminResource;

  slug: string | null;
  label: string;
  message: string;
}

export interface AdminOverview {
  counts: Record<AdminResource, number>;
  attention: AttentionItem[];
}

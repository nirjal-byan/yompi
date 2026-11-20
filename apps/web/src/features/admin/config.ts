import { ADMIN_RESOURCES, type AdminResource } from "@yompi/shared";

export type FieldType =
  "text" | "textarea" | "number" | "date" | "url" | "select" | "trail" | "trek" | "treks";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface ColumnDef {
  header: string;
  value: (row: Record<string, unknown>) => string;
}

export interface ResourceConfig {
  key: AdminResource;
  singular: string;
  plural: string;
  intro: string;

  nameField: string;
  fields: FieldDef[];
  columns: ColumnDef[];
}

export const RESOURCES = ADMIN_RESOURCES;

const text = (row: Record<string, unknown>, key: string) =>
  row[key] === null || row[key] === undefined ? "" : String(row[key]);
const npr = (row: Record<string, unknown>) =>
  `NPR ${Number(row.amountNpr).toLocaleString("en-US")}`;

const PERMIT_UNITS = [
  { value: "PER_PERSON", label: "per person" },
  { value: "PER_PERSON_PER_DAY", label: "per person per day" },
  { value: "PER_GROUP", label: "per group" },
];

const COST_UNITS = [
  { value: "PER_DAY", label: "per day" },
  { value: "PER_NIGHT", label: "per night" },
  { value: "PER_PERSON", label: "per person" },
  { value: "PER_TRIP", label: "per trip" },
];

const COST_CATEGORIES = [
  { value: "GUIDE_DAILY", label: "Guide" },
  { value: "PORTER_DAILY", label: "Porter" },
  { value: "FOOD_DAILY", label: "Food" },
  { value: "LODGING_BUDGET", label: "Lodging: budget" },
  { value: "LODGING_STANDARD", label: "Lodging: standard" },
  { value: "LODGING_COMFORT", label: "Lodging: comfort" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OTHER", label: "Other" },
];

const labelOf = (options: { value: string; label: string }[], value: unknown) =>
  options.find((o) => o.value === value)?.label ?? String(value ?? "");

export const SOURCE_FIELDS: FieldDef[] = [
  {
    name: "sourceName",
    label: "Source name",
    type: "text",
    required: true,
    placeholder: "e.g. the organisation or document that published it",
    help: "Who published this figure. If it is not an official source, say so (for example: an agency guide).",
  },
  {
    name: "sourceUrl",
    label: "Source link",
    type: "url",
    required: true,
    placeholder: "https://",
    help: "The page where anyone can check this figure.",
  },
  {
    name: "verifiedAt",
    label: "Date you checked it",
    type: "date",
    required: true,
    help: "Visitors see this date next to the figure. Re-check and update it when you confirm the figure again.",
  },
];

export const CONFIGS: Record<AdminResource, ResourceConfig> = {
  treks: {
    key: "treks",
    singular: "trek",
    plural: "Treks",
    intro:
      "A trek's typical duration. Link it to a trail so its details show up when someone clicks that trail on the map.",
    nameField: "name",
    fields: [
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. Annapurna Circuit",
      },
      {
        name: "slug",
        label: "Id",
        type: "text",
        required: true,
        help: "Short id used in links (lowercase, dashes). Filled in for you from the name; it cannot be changed later.",
      },
      {
        name: "region",
        label: "Region",
        type: "text",
        required: true,
        placeholder: "e.g. Annapurna",
      },
      {
        name: "trailName",
        label: "Trail on the map",
        type: "trail",
        help: "Optional. Pick the map trail this trek follows. Leave empty for treks that have no line on the map yet.",
      },
      {
        name: "minDays",
        label: "Shortest typical duration (days)",
        type: "number",
        required: true,
      },
      { name: "maxDays", label: "Longest typical duration (days)", type: "number", required: true },
      {
        name: "highestPointM",
        label: "Highest point of the whole trek (m)",
        type: "number",
        help: "Optional. If you leave it empty, the highest point from the (possibly partial) map trail is used for the difficulty estimate.",
      },
      { name: "startPlace", label: "Starts at", type: "text" },
      { name: "endPlace", label: "Ends at", type: "text" },
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        help: "Optional. Anything a visitor should know about these figures.",
      },
    ],
    columns: [
      { header: "Name", value: (r) => text(r, "name") },
      { header: "Region", value: (r) => text(r, "region") },
      { header: "Days", value: (r) => `${text(r, "minDays")}–${text(r, "maxDays")}` },
      { header: "Map trail", value: (r) => text(r, "trailName") || "not linked" },
    ],
  },
  permits: {
    key: "permits",
    singular: "permit",
    plural: "Permits",
    intro: "Permits and entry fees, in Nepali rupees. A permit can apply to several treks.",
    nameField: "name",
    fields: [
      {
        name: "name",
        label: "Permit name",
        type: "text",
        required: true,
        placeholder: "e.g. Conservation area entry permit",
      },
      {
        name: "slug",
        label: "Id",
        type: "text",
        required: true,
        help: "Short id (lowercase, dashes). Filled in for you; it cannot be changed later.",
      },
      { name: "authority", label: "Issued by", type: "text", required: true },
      {
        name: "appliesTo",
        label: "Where it applies",
        type: "text",
        required: true,
        help: "In words, for example the conservation area or national park.",
      },
      {
        name: "amountNpr",
        label: "Fee (NPR)",
        type: "number",
        required: true,
        help: "Whole rupees, no commas.",
      },
      { name: "unit", label: "Charged", type: "select", required: true, options: PERMIT_UNITS },
      {
        name: "trekSlugs",
        label: "Applies to these treks",
        type: "treks",
        required: true,
        help: "Tick every trek that needs this permit.",
      },
      {
        name: "notes",
        label: "Notes",
        type: "textarea",
        help: "Optional. Conditions such as who it applies to or extra charges.",
      },
    ],
    columns: [
      { header: "Permit", value: (r) => text(r, "name") },
      { header: "Fee", value: (r) => `${npr(r)} ${labelOf(PERMIT_UNITS, r.unit)}` },
      { header: "Treks", value: (r) => (Array.isArray(r.trekSlugs) ? r.trekSlugs.join(", ") : "") },
    ],
  },
  costs: {
    key: "costs",
    singular: "cost",
    plural: "Costs",
    intro:
      "Typical prices (guides, porters, food, lodging, transport). A rate for one trek replaces the general rate for that category.",
    nameField: "label",
    fields: [
      {
        name: "label",
        label: "Description",
        type: "text",
        required: true,
        placeholder: "e.g. Licensed guide",
      },
      {
        name: "slug",
        label: "Id",
        type: "text",
        required: true,
        help: "Short id (lowercase, dashes). Filled in for you; it cannot be changed later.",
      },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: COST_CATEGORIES,
      },
      {
        name: "amountNpr",
        label: "Price (NPR)",
        type: "number",
        required: true,
        help: "Whole rupees, no commas.",
      },
      { name: "unit", label: "Charged", type: "select", required: true, options: COST_UNITS },
      {
        name: "trekSlug",
        label: "Applies to",
        type: "trek",
        help: "Leave on 'All treks' for a general rate, or pick one trek for a trek-specific rate.",
      },
      { name: "notes", label: "Notes", type: "textarea", help: "Optional." },
    ],
    columns: [
      { header: "Description", value: (r) => text(r, "label") },
      { header: "Category", value: (r) => labelOf(COST_CATEGORIES, r.category) },
      { header: "Price", value: (r) => `${npr(r)} ${labelOf(COST_UNITS, r.unit)}` },
      { header: "Applies to", value: (r) => text(r, "trekSlug") || "all treks" },
    ],
  },
};

export function isResource(value: string): value is AdminResource {
  return (RESOURCES as readonly string[]).includes(value);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export const todayIso = () => new Date().toISOString().slice(0, 10);

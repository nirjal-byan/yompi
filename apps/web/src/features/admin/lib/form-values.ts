import { type FieldDef, slugify, todayIso } from "../config";

export type FormValue = string | string[];
export type FormValues = Record<string, FormValue>;

export interface TrekOption {
  slug: string;
  name: string;
}

export function blankValues(fields: FieldDef[], isNew: boolean): FormValues {
  const values: FormValues = {};

  for (const field of fields) values[field.name] = field.type === "treks" ? [] : "";
  if (isNew) values.verifiedAt = todayIso();

  return values;
}

export function valuesFromRecord(record: Record<string, unknown>, fields: FieldDef[]): FormValues {
  const values = blankValues(fields, false);

  for (const field of fields) {
    const value = record[field.name];

    if (Array.isArray(value)) values[field.name] = value.map(String);
    else if (value !== null && value !== undefined) values[field.name] = String(value);
  }

  return values;
}

export function valuesForTrail(trailName: string): FormValues {
  return { trailName, name: trailName, slug: slugify(trailName) };
}

export function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const rest = { ...record };
  delete rest[key];

  return rest;
}

export function focusFirstInvalidField(): void {
  requestAnimationFrame(() => {
    const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    first?.focus({ preventScroll: true });
  });
}

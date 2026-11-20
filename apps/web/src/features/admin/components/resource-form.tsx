"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import type { AdminResource } from "@yompi/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminApiError, adminApi } from "../services/admin-api";
import { CONFIGS, type FieldDef, SOURCE_FIELDS, slugify, todayIso } from "../config";

type Values = Record<string, string | string[]>;
type SlugName = { slug: string; name: string };

function blankValues(fields: FieldDef[], isNew: boolean): Values {
  const values: Values = {};
  for (const field of fields) values[field.name] = field.type === "treks" ? [] : "";
  if (isNew) values.verifiedAt = todayIso();
  return values;
}

function toValues(record: Record<string, unknown>, fields: FieldDef[]): Values {
  const values = blankValues(fields, false);
  for (const field of fields) {
    const value = record[field.name];
    if (Array.isArray(value)) values[field.name] = value.map(String);
    else if (value !== null && value !== undefined) values[field.name] = String(value);
  }
  return values;
}

function FormField({ field, error, children }: { field: FieldDef; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.name} className="text-sm font-semibold">
        {field.label}
        {field.required && <span className="text-red-700"> *</span>}
      </label>
      {children}
      {field.help && !error && <p className="text-xs text-muted">{field.help}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function ResourceForm({ resource, slug }: { resource: AdminResource; slug: string }) {
  const config = CONFIGS[resource];
  const isNew = slug === "new";
  const router = useRouter();
  const presetTrail = useSearchParams().get("trail");
  const allFields = [...config.fields, ...SOURCE_FIELDS];
  const needsTrails = config.fields.some((f) => f.type === "trail");
  const needsTreks = config.fields.some((f) => f.type === "trek" || f.type === "treks");

  const [values, setValues] = useState<Values>(() => {
    const initial = blankValues(allFields, isNew);
    // Arriving from a "trail has no details yet" to-do item: start with that trail selected.
    if (isNew && resource === "treks" && presetTrail) {
      initial.trailName = presetTrail;
      initial.name = presetTrail;
      initial.slug = slugify(presetTrail);
    }
    return initial;
  });
  const [slugTouched, setSlugTouched] = useState(!isNew || Boolean(presetTrail));
  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState(false);
  const [trails, setTrails] = useState<string[]>([]);
  const [treks, setTreks] = useState<SlugName[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (needsTrails) adminApi.trails().then((data) => !cancelled && setTrails(data)).catch(() => undefined);
    if (needsTreks) adminApi.list<SlugName>("treks").then((data) => !cancelled && setTreks(data)).catch(() => undefined);
    if (!isNew) {
      adminApi
        .get<Record<string, unknown>>(resource, slug)
        .then((record) => {
          if (cancelled) return;
          setValues(toValues(record, allFields));
          setLoading(false);
        })
        .catch(() => !cancelled && setLoadError(true));
    }
    return () => {
      cancelled = true;
    };
    // The field lists are constants of the resource, so they do not need to be dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, slug]);

  function set(name: string, value: string | string[]) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      // A new record's id follows its name until the id is edited by hand.
      if (isNew && !slugTouched && name === config.nameField && typeof value === "string") next.slug = slugify(value);
      return next;
    });
    setErrors((current) => {
      if (!current[name]) return current;
      const rest = { ...current };
      delete rest[name];
      return rest;
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);
    setErrors({});
    try {
      if (isNew) await adminApi.create(resource, values);
      else await adminApi.update(resource, slug, values);
      router.push(`/admin/${resource}?saved=1`);
    } catch (e) {
      setSaving(false);
      if (e instanceof AdminApiError && e.errors.length > 0) {
        setErrors(Object.fromEntries(e.errors.map((err) => [err.field, err.message])));
        setFormError("Some fields need attention. They are marked below.");
        // Bring the first problem into view and focus it (errors can be far below the banner).
        requestAnimationFrame(() => {
          const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
          first?.scrollIntoView({ block: "center", behavior: "smooth" });
          first?.focus({ preventScroll: true });
        });
      } else if (e instanceof AdminApiError && (e.status === 401 || e.status === 403)) {
        setFormError("You are signed out or not allowed to edit. Sign in again and retry.");
      } else {
        setFormError("We couldn't save. Please try again.");
      }
    }
  }

  async function remove() {
    if (!window.confirm(`Delete this ${config.singular}? This cannot be undone.`)) return;
    try {
      await adminApi.remove(resource, slug);
      router.push(`/admin/${resource}?saved=1`);
    } catch {
      setFormError("Could not delete. Please try again.");
    }
  }

  function control(field: FieldDef) {
    const value = values[field.name];
    const common = { id: field.name, name: field.name, "aria-invalid": Boolean(errors[field.name]) || undefined };

    switch (field.type) {
      case "textarea":
        return <Textarea {...common} value={value as string} onChange={(e) => set(field.name, e.target.value)} />;
      case "select":
        return (
          <Select {...common} value={value as string} onChange={(e) => set(field.name, e.target.value)}>
            <option value="">Choose…</option>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        );
      case "trail":
        return (
          <Select {...common} value={value as string} onChange={(e) => set(field.name, e.target.value)}>
            <option value="">Not linked to a map trail</option>
            {trails.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        );
      case "trek":
        return (
          <Select {...common} value={value as string} onChange={(e) => set(field.name, e.target.value)}>
            <option value="">All treks (general rate)</option>
            {treks.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </Select>
        );
      case "treks":
        return (
          <div id={field.name} className="flex flex-col gap-2 border border-border-soft bg-surface p-3">
            {treks.length === 0 && <p className="text-sm text-muted">Add a trek first, then come back to link it.</p>}
            {treks.map((t) => {
              const chosen = (value as string[]).includes(t.slug);
              return (
                <label key={t.slug} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={chosen}
                    onChange={() => set(field.name, chosen ? (value as string[]).filter((s) => s !== t.slug) : [...(value as string[]), t.slug])}
                  />
                  {t.name}
                </label>
              );
            })}
          </div>
        );
      case "date":
        return (
          <div className="flex gap-2">
            <Input {...common} type="date" value={value as string} onChange={(e) => set(field.name, e.target.value)} />
            <Button type="button" variant="outline" className="shrink-0" onClick={() => set(field.name, todayIso())}>
              Today
            </Button>
          </div>
        );
      case "number":
        return <Input {...common} type="number" inputMode="numeric" min={0} value={value as string} onChange={(e) => set(field.name, e.target.value)} />;
      default:
        return (
          <Input
            {...common}
            type={field.type === "url" ? "url" : "text"}
            placeholder={field.placeholder}
            disabled={field.name === "slug" && !isNew}
            value={value as string}
            onChange={(e) => {
              if (field.name === "slug") setSlugTouched(true);
              set(field.name, e.target.value);
            }}
          />
        );
    }
  }

  if (loadError) {
    return (
      <p className="text-sm text-muted">
        We couldn&apos;t find that {config.singular}. <Link href={`/admin/${resource}`} className="underline">Back to the list</Link>
      </p>
    );
  }
  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <form onSubmit={submit} className="flex max-w-3xl flex-col gap-6 border border-border-soft bg-surface p-6 md:p-8" noValidate>
      <div>
        <p className="text-sm">
          <Link href={`/admin/${resource}`} className="underline">
            ← {config.plural}
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{isNew ? `Add a ${config.singular}` : `Edit ${config.singular}`}</h1>
      </div>

      {formError && (
        <p role="alert" className="border-l-2 border-red-600 bg-red-50 px-4 py-2 text-sm text-red-800">
          {formError}
        </p>
      )}

      <section className="flex flex-col gap-5">
        {config.fields.map((field) => (
          <FormField key={field.name} field={field} error={errors[field.name]}>
            {control(field)}
          </FormField>
        ))}
      </section>

      <section className="flex flex-col gap-5 border-t border-border-soft pt-6">
        <div>
          <h2 className="font-display text-xl font-semibold">Where does this come from?</h2>
          <p className="text-sm text-muted">
            Every figure needs a source so visitors (and you, later) can check it. Nothing can be saved without these three.
          </p>
        </div>
        {SOURCE_FIELDS.map((field) => (
          <FormField key={field.name} field={field} error={errors[field.name]}>
            {control(field)}
          </FormField>
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-6">
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Link href={`/admin/${resource}`} className="inline-flex h-11 items-center px-3 text-sm underline">
            Cancel
          </Link>
        </div>
        {!isNew && (
          <Button type="button" variant="outline" className="text-red-800" onClick={remove}>
            Delete {config.singular}
          </Button>
        )}
      </div>
    </form>
  );
}

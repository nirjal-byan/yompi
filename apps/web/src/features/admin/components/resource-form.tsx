"use client";

import Link from "next/link";
import type { AdminResource } from "@yompi/shared";
import { Button } from "@/components/ui/button";
import { SOURCE_FIELDS, type FieldDef } from "../config";
import { useResourceForm } from "../hooks/use-resource-form";
import { FieldControl } from "./field-control";
import { FormField } from "./form-field";

interface ResourceFormProps {
  resource: AdminResource;
  slug: string;
}

export function ResourceForm({ resource, slug }: ResourceFormProps) {
  const form = useResourceForm(resource, slug);
  const { config, isNew, values, errors } = form;
  const listPath = `/admin/${resource}`;

  const renderField = (field: FieldDef) => (
    <FormField key={field.name} field={field} error={errors[field.name]}>
      <FieldControl
        field={field}
        value={values[field.name]}
        invalid={Boolean(errors[field.name])}
        locked={field.name === "slug" && !isNew}
        trails={form.trails}
        treks={form.treks}
        onChange={(value) => form.changeValue(field.name, value)}
      />
    </FormField>
  );

  if (form.notFound) {
    return (
      <p className="text-sm text-muted">
        We couldn&apos;t find that {config.singular}.{" "}
        <Link href={listPath} className="underline">
          Back to the list
        </Link>
      </p>
    );
  }

  if (form.loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <form
      onSubmit={form.submit}
      className="flex max-w-3xl flex-col gap-6 border border-border-soft bg-surface p-6 md:p-8"
      noValidate
    >
      <div>
        <p className="text-sm">
          <Link href={listPath} className="underline">
            ← {config.plural}
          </Link>
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          {isNew ? `Add a ${config.singular}` : `Edit ${config.singular}`}
        </h1>
      </div>

      {form.formError && (
        <p
          role="alert"
          className="border-l-2 border-red-600 bg-red-50 px-4 py-2 text-sm text-red-800"
        >
          {form.formError}
        </p>
      )}

      <section className="flex flex-col gap-5">{config.fields.map(renderField)}</section>

      <section className="flex flex-col gap-5 border-t border-border-soft pt-6">
        <div>
          <h2 className="font-display text-xl font-semibold">Where does this come from?</h2>
          <p className="text-sm text-muted">
            Every figure needs a source so visitors (and you, later) can check it. Nothing can be
            saved without these three.
          </p>
        </div>
        {SOURCE_FIELDS.map(renderField)}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft pt-6">
        <div className="flex gap-3">
          <Button type="submit" disabled={form.saving}>
            {form.saving ? "Saving…" : "Save"}
          </Button>
          <Link href={listPath} className="inline-flex h-11 items-center px-3 text-sm underline">
            Cancel
          </Link>
        </div>
        {!isNew && (
          <Button type="button" variant="outline" className="text-red-800" onClick={form.remove}>
            Delete {config.singular}
          </Button>
        )}
      </div>
    </form>
  );
}

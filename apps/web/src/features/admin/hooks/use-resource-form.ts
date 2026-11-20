"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { AdminResource } from "@yompi/shared";
import { CONFIGS, SOURCE_FIELDS, slugify } from "../config";
import {
  type FormValue,
  type FormValues,
  type TrekOption,
  blankValues,
  focusFirstInvalidField,
  valuesForTrail,
  valuesFromRecord,
  withoutKey,
} from "../lib/form-values";
import { AdminApiError, adminApi } from "../services/admin-api";

const SAVE_FAILED = "We couldn't save. Please try again.";
const NEEDS_ATTENTION = "Some fields need attention. They are marked below.";
const NOT_ALLOWED = "You are signed out or not allowed to edit. Sign in again and retry.";

export function useResourceForm(resource: AdminResource, slug: string) {
  const config = CONFIGS[resource];
  const isNew = slug === "new";
  const router = useRouter();
  const presetTrail = useSearchParams().get("trail");

  const fields = useMemo(() => [...config.fields, ...SOURCE_FIELDS], [config]);
  const needsTrails = config.fields.some((field) => field.type === "trail");
  const needsTreks = config.fields.some((field) => field.type === "trek" || field.type === "treks");

  const [values, setValues] = useState<FormValues>(() => ({
    ...blankValues(fields, isNew),
    ...(isNew && resource === "treks" && presetTrail ? valuesForTrail(presetTrail) : {}),
  }));
  const [slugEdited, setSlugEdited] = useState(!isNew || Boolean(presetTrail));
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [trails, setTrails] = useState<string[]>([]);
  const [treks, setTreks] = useState<TrekOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (needsTrails) {
      adminApi
        .trails()
        .then((names) => !cancelled && setTrails(names))
        .catch(() => undefined);
    }

    if (needsTreks) {
      adminApi
        .list<TrekOption>("treks")
        .then((options) => !cancelled && setTreks(options))
        .catch(() => undefined);
    }

    if (!isNew) {
      adminApi
        .get<Record<string, unknown>>(resource, slug)
        .then((record) => {
          if (cancelled) return;
          setValues(valuesFromRecord(record, fields));
          setLoading(false);
        })
        .catch(() => !cancelled && setNotFound(true));
    }

    return () => {
      cancelled = true;
    };
  }, [resource, slug, isNew, fields, needsTrails, needsTreks]);

  function changeValue(name: string, value: FormValue) {
    if (name === "slug") setSlugEdited(true);

    setValues((current) => {
      const next = { ...current, [name]: value };
      const followsName = isNew && !slugEdited && name === config.nameField;
      if (followsName && typeof value === "string") next.slug = slugify(value);
      return next;
    });
    setErrors((current) => (current[name] ? withoutKey(current, name) : current));
  }

  function showSaveError(error: unknown) {
    if (error instanceof AdminApiError && error.errors.length > 0) {
      setErrors(Object.fromEntries(error.errors.map((item) => [item.field, item.message])));
      setFormError(NEEDS_ATTENTION);
      focusFirstInvalidField();
    } else if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
      setFormError(NOT_ALLOWED);
    } else {
      setFormError(SAVE_FAILED);
    }
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
    } catch (error) {
      setSaving(false);
      showSaveError(error);
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

  return {
    config,
    isNew,
    values,
    errors,
    formError,
    saving,
    loading,
    notFound,
    trails,
    treks,
    changeValue,
    submit,
    remove,
  };
}

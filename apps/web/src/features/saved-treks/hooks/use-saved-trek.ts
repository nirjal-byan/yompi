"use client";

import { useEffect, useState } from "react";
import { fetchSavedSlugs, setTrekSaved } from "../services/saved-treks-api";

type Status = "loading" | "signed-out" | "ready" | "unavailable";

export function useSavedTrek(slug: string) {
  const [status, setStatus] = useState<Status>("loading");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchSavedSlugs({ credentials: "include" })
      .then((slugs) => {
        if (cancelled) return;
        setSaved(slugs?.includes(slug) ?? false);
        setStatus(slugs ? "ready" : "signed-out");
      })
      .catch(() => !cancelled && setStatus("unavailable"));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function toggle() {
    setBusy(true);
    setFailed(false);

    try {
      await setTrekSaved(slug, !saved);
      setSaved(!saved);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return { status, saved, busy, failed, toggle };
}

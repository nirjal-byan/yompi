"use client";

import { useState } from "react";
import { MAX_COMPARED_TREKS } from "../lib/compare";

export function useCompareSelection() {
  const [slugs, setSlugs] = useState<string[]>([]);

  const toggle = (slug: string) =>
    setSlugs((current) => {
      if (current.includes(slug)) return current.filter((existing) => existing !== slug);
      if (current.length >= MAX_COMPARED_TREKS) return current;

      return [...current, slug];
    });

  return {
    slugs,
    isFull: slugs.length >= MAX_COMPARED_TREKS,
    has: (slug: string) => slugs.includes(slug),
    toggle,
    clear: () => setSlugs([]),
  };
}

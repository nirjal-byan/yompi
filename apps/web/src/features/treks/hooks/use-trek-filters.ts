"use client";

import { useMemo, useState } from "react";
import type { TrekSummary } from "@yompi/shared";
import { applyFilters, defaultFilters, getBounds } from "../lib/filter-treks";

export function useTrekFilters(treks: TrekSummary[]) {
  const bounds = useMemo(() => getBounds(treks), [treks]);
  const [filters, setFilters] = useState(() => defaultFilters(bounds));
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filtered = useMemo(() => applyFilters(treks, filters, bounds), [treks, filters, bounds]);
  const selected = filtered.find((trek) => trek.slug === selectedSlug) ?? filtered[0] ?? null;

  const toggleRegion = (region: string) =>
    setFilters((current) => ({
      ...current,
      regions: current.regions.includes(region)
        ? current.regions.filter((name) => name !== region)
        : [...current.regions, region],
    }));

  return {
    bounds,
    filters,
    filtered,
    selected,
    select: setSelectedSlug,
    toggleRegion,
    setMaxCost: (maxCostNpr: number) => setFilters((current) => ({ ...current, maxCostNpr })),
    setMaxAltitude: (maxAltitudeM: number) =>
      setFilters((current) => ({ ...current, maxAltitudeM })),
    reset: () => setFilters(defaultFilters(bounds)),
  };
}

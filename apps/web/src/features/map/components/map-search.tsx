"use client";

import { useMemo, useState } from "react";
import type { GeoFeature } from "@yompi/shared";
import { Input } from "@/components/ui/input";
import { KIND_LABEL } from "../constants";

export function MapSearch({
  features,
  onPick,
}: {
  features: GeoFeature[];
  onPick: (feature: GeoFeature) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return features
      .filter((f) => f.properties.name.toLowerCase().includes(q) || f.properties.nameLocal?.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStart = a.properties.name.toLowerCase().startsWith(q) ? 0 : 1;
        const bStart = b.properties.name.toLowerCase().startsWith(q) ? 0 : 1;
        return aStart - bStart || (b.properties.elevationM ?? 0) - (a.properties.elevationM ?? 0);
      })
      .slice(0, 7);
  }, [query, features]);

  function pick(feature: GeoFeature) {
    onPick(feature);
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative w-full max-w-[420px]">
      <Input
        type="search"
        aria-label="Find a mountain, trail or village"
        placeholder="Find a mountain, trail or village"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) pick(results[0]);
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-11 border-border"
      />
      {open && query.trim() && (
        <ul className="absolute top-full right-0 left-0 z-20 border border-border bg-surface shadow-md">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted">Nothing found for &ldquo;{query}&rdquo;</li>
          ) : (
            results.map((f) => (
              <li key={f.id}>
                {/* onMouseDown fires before the input's blur closes the list. */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(f);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-muted"
                >
                  <span>{f.properties.name}</span>
                  <span className="font-mono text-[11px] text-muted uppercase">
                    {KIND_LABEL[f.properties.kind]}
                    {f.properties.elevationM ? ` · ${f.properties.elevationM.toLocaleString("en-US")} m` : ""}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

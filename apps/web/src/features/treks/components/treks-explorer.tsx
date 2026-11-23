"use client";

import Image from "next/image";
import type { TrekSummary } from "@yompi/shared";
import type { TrekImage } from "../lib/trek-image";
import { useTrekFilters } from "../hooks/use-trek-filters";
import { TrekCard } from "./trek-card";
import { TrekFilters } from "./trek-filters";
import { PREVIEW_HEIGHT_CLASS, TrekPreview } from "./trek-preview";

interface TreksExplorerProps {
  treks: TrekSummary[];
  images: Record<string, TrekImage | null>;
}

function PreparationNote() {
  return (
    <div className="flex items-center gap-4 bg-accent-soft px-6 py-4">
      <Image src="/brand/yompi-mark.png" alt="" width={44} height={40} />
      <div>
        <p className="text-sm font-semibold">A little preparation goes a long way.</p>
        <p className="text-xs text-muted">
          Check permits, acclimatisation and recent trail reports before setting off. Prices are
          estimates built from sourced permit and daily costs.
        </p>
      </div>
    </div>
  );
}

export function TreksExplorer({ treks, images }: TreksExplorerProps) {
  const { bounds, filters, filtered, selected, select, ...actions } = useTrekFilters(treks);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <TrekFilters
        bounds={bounds}
        filters={filters}
        resultCount={filtered.length}
        onToggleRegion={actions.toggleRegion}
        onMaxCost={actions.setMaxCost}
        onMaxAltitude={actions.setMaxAltitude}
        onReset={actions.reset}
      />

      <div className="flex min-w-0 flex-col gap-6">
        {selected ? (
          <TrekPreview trek={selected} image={images[selected.slug] ?? null} />
        ) : (
          <div
            className={`flex items-center justify-center border border-border-soft bg-surface p-6 text-sm text-muted ${PREVIEW_HEIGHT_CLASS}`}
          >
            No treks match these filters. Try widening them or reset.
          </div>
        )}

        <div className="flex flex-col gap-1">
          <h2 className="font-display text-3xl font-semibold">Pick your trail</h2>
          <p className="text-sm text-muted">Compare the challenge, not just the view.</p>
        </div>

        {filtered.length > 0 && (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((trek) => (
              <li key={trek.slug}>
                <TrekCard
                  trek={trek}
                  selected={trek.slug === selected?.slug}
                  onSelect={() => select(trek.slug)}
                />
              </li>
            ))}
          </ul>
        )}

        <PreparationNote />
      </div>
    </div>
  );
}

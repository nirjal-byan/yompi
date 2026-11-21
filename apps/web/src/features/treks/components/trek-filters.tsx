"use client";

import { Button } from "@/components/ui/button";
import { FILTER_STEPS, type TrekBounds, type TrekFilters } from "../lib/filter-treks";
import { formatMetres, formatNpr } from "../lib/format";

interface TrekFiltersProps {
  bounds: TrekBounds;
  filters: TrekFilters;
  resultCount: number;
  onToggleRegion: (region: string) => void;
  onMaxCost: (value: number) => void;
  onMaxAltitude: (value: number) => void;
  onReset: () => void;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-border-soft pt-4">
      <legend className="font-mono text-[10px] text-muted uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

interface RangeProps {
  label: string;
  value: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

function RangeField({ label, value, max, step, display, onChange }: RangeProps) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="flex justify-between gap-2">
        <span>{label}</span>
        <span className="font-semibold">{display}</span>
      </span>
      <input
        type="range"
        min={step}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="accent-foreground"
      />
    </label>
  );
}

export function TrekFilters(props: TrekFiltersProps) {
  const { bounds, filters, resultCount } = props;

  return (
    <aside
      aria-label="Filter treks"
      className="flex flex-col gap-4 border border-border-soft bg-surface p-5 lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Filters</h2>
        <span className="text-xs text-muted" aria-live="polite">
          {resultCount} {resultCount === 1 ? "trek" : "treks"}
        </span>
      </div>

      <FilterGroup title="Region">
        {bounds.regions.map((region) => (
          <label key={region} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={filters.regions.includes(region)}
              onChange={() => props.onToggleRegion(region)}
              className="accent-foreground"
            />
            {region}
          </label>
        ))}
      </FilterGroup>

      {bounds.maxCostNpr > 0 && (
        <FilterGroup title="Price per person">
          <RangeField
            label="Up to"
            value={filters.maxCostNpr}
            max={bounds.maxCostNpr}
            step={FILTER_STEPS.cost}
            display={formatNpr(filters.maxCostNpr)}
            onChange={props.onMaxCost}
          />
        </FilterGroup>
      )}

      {bounds.maxAltitudeM > 0 && (
        <FilterGroup title="Altitude">
          <RangeField
            label="Up to"
            value={filters.maxAltitudeM}
            max={bounds.maxAltitudeM}
            step={FILTER_STEPS.altitude}
            display={formatMetres(filters.maxAltitudeM)}
            onChange={props.onMaxAltitude}
          />
        </FilterGroup>
      )}

      <Button type="button" variant="soft" onClick={props.onReset}>
        Reset filters
      </Button>
    </aside>
  );
}

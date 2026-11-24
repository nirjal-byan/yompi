"use client";

import { useMemo, useState } from "react";
import type { StayInfo, StayTier } from "@yompi/shared";
import { Select } from "@/components/ui/select";
import { TIER_LABEL } from "@/features/treks/lib/tiers";
import { StayCard } from "./stay-card";

const ALL = "ALL";

function uniqueTreks(stays: StayInfo[]): Array<{ slug: string; name: string }> {
  const treks = new Map(stays.map((stay) => [stay.trekSlug, stay.trekName]));

  return [...treks].map(([slug, name]) => ({ slug, name }));
}

export function StaysExplorer({ stays }: { stays: StayInfo[] }) {
  const [trek, setTrek] = useState(ALL);
  const [tier, setTier] = useState<StayTier | typeof ALL>(ALL);

  const treks = useMemo(() => uniqueTreks(stays), [stays]);
  const visible = stays.filter(
    (stay) => (trek === ALL || stay.trekSlug === trek) && (tier === ALL || stay.tier === tier),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Trek
          <Select value={trek} onChange={(event) => setTrek(event.target.value)}>
            <option value={ALL}>All treks</option>
            {treks.map(({ slug, name }) => (
              <option key={slug} value={slug}>
                {name}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Comfort level
          <Select
            value={tier}
            onChange={(event) => setTier(event.target.value as StayTier | typeof ALL)}
          >
            <option value={ALL}>Any level</option>
            {Object.entries(TIER_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {visible.length} {visible.length === 1 ? "stay" : "stays"}
      </p>

      {visible.length === 0 ? (
        <p className="border border-border-soft bg-surface p-6 text-sm text-muted">
          No stays match these filters.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((stay) => (
            <li key={stay.slug}>
              <StayCard stay={stay} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

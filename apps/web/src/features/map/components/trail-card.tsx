"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { GeoFeature, NearbyFeature } from "@yompi/shared";
import { cn } from "@/lib/cn";
import { KIND_LABEL, METERS_TO_FEET } from "../constants";
import { useFeatureDetail } from "../hooks/use-feature-detail";
import { TrekPlanning } from "./trek-info";

const ElevationChart = dynamic(() => import("./elevation-chart"), {
  ssr: false,
  loading: () => <div className="h-[150px] animate-pulse bg-surface-muted" />,
});

const NEARBY_GROUPS: Array<{ kind: NearbyFeature["kind"]; label: string }> = [
  { kind: "PASS", label: "Passes" },
  { kind: "GATEWAY", label: "Gateways" },
  { kind: "LAKE", label: "Lakes" },
  { kind: "PEAK", label: "Peaks nearby" },
];

const fmt = (n: number) => n.toLocaleString("en-US");

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] text-muted uppercase">{label}</dt>
      <dd className="text-base font-semibold">{value}</dd>
      {hint && <dd className="text-[11px] text-muted">{hint}</dd>}
    </div>
  );
}

export function TrailCard({ feature, onClose }: { feature: GeoFeature; onClose: () => void }) {
  const { detail, loading, failed } = useFeatureDetail(feature.id);
  const [chosen, setChosen] = useState<{ id: string; index: number }>({ id: feature.id, index: 0 });
  const sectionIndex = chosen.id === feature.id ? chosen.index : 0;

  const { name, nameLocal, details } = feature.properties;
  const mappedKm = typeof details?.computedKm === "number" ? details.computedKm : null;
  const listedKm = typeof details?.osmDistanceKm === "number" ? details.osmDistanceKm : null;
  const partial = mappedKm !== null && listedKm !== null && mappedKm < listedKm * 0.9;
  const profile = detail?.profile ?? null;
  const section = profile?.sections[Math.min(sectionIndex, (profile?.sections.length ?? 1) - 1)];

  return (
    <div
      role="status"
      className="max-h-full w-[min(390px,100%)] overflow-y-auto border border-border bg-surface p-5 shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="bg-primary/30 px-2 py-1 font-mono text-[10px] uppercase">
          {KIND_LABEL.TRAIL}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="-mt-1 -mr-1 px-2 py-1 text-lg leading-none hover:bg-surface-muted"
        >
          ×
        </button>
      </div>
      <h2 className="mt-3 font-display text-2xl leading-tight font-semibold">{name}</h2>
      {nameLocal && <p className="text-sm text-muted">{nameLocal}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {mappedKm !== null && (
          <Stat
            label="Mapped length"
            value={`~${fmt(mappedKm)} km`}
            hint={listedKm !== null ? `of ~${fmt(listedKm)} km listed` : undefined}
          />
        )}
        {profile && (
          <>
            <Stat
              label="Highest point"
              value={`${fmt(profile.highestM)} m`}
              hint={`${fmt(Math.round(profile.highestM * METERS_TO_FEET))} ft`}
            />
            <Stat label="Lowest point" value={`${fmt(profile.lowestM)} m`} />
            <Stat
              label="Ascent / descent"
              value={`~${fmt(profile.ascentM)} / ${fmt(profile.descentM)} m`}
              hint="mapped parts only"
            />
          </>
        )}
      </dl>

      {partial && (
        <p className="mt-3 border-l-2 border-primary pl-3 text-xs text-muted">
          OpenStreetMap only has part of this route so far, so the length, highest point and profile
          cover the mapped parts only, not the whole trek.
        </p>
      )}

      <TrekPlanning trek={detail?.trek ?? null} loaded={!!detail} />

      {loading && (
        <div
          className="mt-4 h-[150px] animate-pulse bg-surface-muted"
          aria-label="Loading elevation profile"
        />
      )}
      {failed && (
        <p className="mt-4 text-sm text-muted">
          We couldn&apos;t load this trail&apos;s elevation profile.
        </p>
      )}

      {profile && section && (
        <div className="mt-4">
          <p className="font-mono text-[10px] text-muted uppercase">Elevation profile (m)</p>
          {profile.sections.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Mapped sections">
              {profile.sections.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  aria-pressed={i === sectionIndex}
                  onClick={() => setChosen({ id: feature.id, index: i })}
                  className={cn(
                    "h-7 px-2.5 text-xs transition-colors",
                    i === sectionIndex
                      ? "bg-foreground text-background"
                      : "bg-surface-muted hover:bg-border-soft",
                  )}
                >
                  Section {i + 1} · {fmt(Math.round(s.lengthKm))} km
                </button>
              ))}
            </div>
          )}
          <div className="mt-2">
            <ElevationChart elevationsM={section.elevationsM} spacingKm={profile.spacingKm} />
          </div>
          {profile.sections.length > 1 && (
            <p className="mt-1 text-[11px] text-muted">
              Sections are the continuous stretches mapped so far. Gaps between them are not drawn.
            </p>
          )}
        </div>
      )}

      {detail && detail.nearby.length > 0 && (
        <div className="mt-4 flex flex-col gap-2.5">
          {NEARBY_GROUPS.map(({ kind, label }) => {
            const items = detail.nearby.filter((n) => n.kind === kind);
            if (items.length === 0) return null;
            return (
              <div key={kind}>
                <p className="font-mono text-[10px] text-muted uppercase">{label}</p>
                <p className="text-sm">
                  {items.map((n, i) => (
                    <span key={n.id}>
                      {i > 0 && " · "}
                      {n.name}
                      {n.elevationM ? (
                        <span className="text-muted"> {fmt(n.elevationM)} m</span>
                      ) : null}
                    </span>
                  ))}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Route from OpenStreetMap contributors.{profile ? ` ${profile.method}` : ""}
      </p>
    </div>
  );
}

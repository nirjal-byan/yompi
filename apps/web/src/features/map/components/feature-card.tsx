import type { GeoFeature } from "@yompi/shared";
import { KIND_LABEL, METERS_TO_FEET } from "../constants";
import { PeakFactBox } from "./peak-facts";

export function FeatureCard({ feature, onClose }: { feature: GeoFeature; onClose: () => void }) {
  const { kind, name, nameLocal, elevationM, details } = feature.properties;
  const mappedKm = typeof details?.computedKm === "number" ? details.computedKm : null;
  const listedKm = typeof details?.osmDistanceKm === "number" ? details.osmDistanceKm : null;
  const partial = mappedKm !== null && listedKm !== null && mappedKm < listedKm * 0.9;

  return (
    <div
      className="w-[min(320px,calc(100%-2rem))] border border-border bg-surface p-5 shadow-md"
      role="status"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="bg-primary/30 px-2 py-1 font-mono text-[10px] uppercase">
          {KIND_LABEL[kind]}
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

      {elevationM !== null && (
        <p className="mt-3 text-sm">
          <span className="text-lg font-semibold">{elevationM.toLocaleString("en-US")} m</span>{" "}
          <span className="text-muted">
            ({Math.round(elevationM * METERS_TO_FEET).toLocaleString("en-US")} ft)
          </span>
        </p>
      )}

      {kind === "PEAK" && <PeakFactBox name={name} mapElevationM={elevationM} />}

      {kind === "TRAIL" && mappedKm !== null && (
        <p className="mt-3 text-sm">
          About <span className="font-semibold">{mappedKm} km</span> mapped
          {listedKm !== null && <span className="text-muted"> of ~{listedKm} km listed</span>}
          {partial && (
            <span className="mt-2 block text-xs text-muted">
              OpenStreetMap only has part of this route so far, so the line on the map is
              incomplete.
            </span>
          )}
        </p>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Position and height from OpenStreetMap contributors.
      </p>
    </div>
  );
}

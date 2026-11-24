"use client";

import { useMapEngine } from "../hooks/use-map-engine";
import { BUTTON_ZOOM_FACTOR } from "../lib/engine/constants";
import { FeatureCard } from "./feature-card";
import { IntroCard } from "./intro-card";
import { LayerChips } from "./layer-chips";
import { MapAttribution } from "./map-attribution";
import { MapPlaceholder } from "./map-placeholder";
import { MapSearch } from "./map-search";
import { TrailCard } from "./trail-card";
import { ZoomControls } from "./zoom-controls";

const isAnnapurnaTrail = (name: string) => /annapurna/i.test(name);

export function ExploreMap({ initialFeatureId = null }: { initialFeatureId?: string | null }) {
  const {
    hostRef,
    data,
    failed,
    retry,
    layers,
    toggleLayer,
    showAllLayers,
    selected,
    searchableFeatures,
    selectFeature,
    clearSelection,
    zoomBy,
    focusTrails,
  } = useMapEngine(initialFeatureId);

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] tracking-wide text-accent uppercase">
            The Himalayas are calling
          </p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">
            Big mountains. Little hops.
          </h1>
          <p className="text-muted">
            Explore Nepal like a game. Plan your trek for the real world.
          </p>
        </div>
        <MapSearch features={searchableFeatures} onPick={(feature) => selectFeature(feature.id)} />
      </div>

      <LayerChips layers={layers} onToggle={toggleLayer} onShowAll={showAllLayers} />

      <section className="relative h-[calc(100dvh-380px)] min-h-[460px] overflow-hidden border border-border bg-[#f1ebdc]">
        <div ref={hostRef} className="absolute inset-0" />

        {!data && <MapPlaceholder failed={failed} onRetry={retry} />}

        {data && (
          <>
            <p className="pointer-events-none absolute top-3 left-3 bg-surface px-3 py-1.5 font-mono text-[11px] uppercase">
              Nepal / Adventure map
            </p>

            <ZoomControls
              onZoomIn={() => zoomBy(BUTTON_ZOOM_FACTOR)}
              onZoomOut={() => zoomBy(1 / BUTTON_ZOOM_FACTOR)}
            />

            <div className="absolute bottom-3 left-3 flex max-h-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)]">
              {selected?.properties.kind === "TRAIL" && (
                <TrailCard feature={selected} onClose={clearSelection} />
              )}
              {selected && selected.properties.kind !== "TRAIL" && (
                <FeatureCard feature={selected} onClose={clearSelection} />
              )}
              {!selected && <IntroCard onStart={() => focusTrails(isAnnapurnaTrail)} />}
            </div>

            <MapAttribution sources={data.sources} showTerrain={layers.terrain} />
          </>
        )}
      </section>

      <p className="text-xs text-muted">
        Real peaks, cities and trails from open map data. Some trails are only partly mapped, and
        nothing here is live trail advice.
      </p>
    </main>
  );
}

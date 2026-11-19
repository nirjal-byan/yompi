"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoFeature, GeoFeatureCollection } from "@yompi/shared";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/cn";
import { TERRAIN_ATTRIBUTION } from "../constants";
import { getGeoFeatures } from "../services/geo-api";
import type { MapLayers, NepalMapEngine } from "../lib/map-engine";
import { FeatureCard } from "./feature-card";
import { MapSearch } from "./map-search";

const DEFAULT_LAYERS: MapLayers = { terrain: true, peaks: true, lakes: true, passes: true, trails: true, places: true };

const LAYER_CHIPS: Array<{ key: keyof MapLayers; label: string }> = [
  { key: "terrain", label: "Terrain" },
  { key: "peaks", label: "Peaks" },
  { key: "lakes", label: "Lakes" },
  { key: "passes", label: "Passes" },
  { key: "trails", label: "Trails" },
  { key: "places", label: "Cities & gateways" },
];

export function ExploreMap() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NepalMapEngine | null>(null);
  const layersRef = useRef<MapLayers>(DEFAULT_LAYERS);

  const [data, setData] = useState<GeoFeatureCollection | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [layers, setLayers] = useState<MapLayers>(DEFAULT_LAYERS);
  const [selected, setSelected] = useState<GeoFeature | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGeoFeatures()
      .then((result) => !cancelled && setData(result))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    const host = hostRef.current;
    if (!data || !host) return;
    let cancelled = false;
    let engine: NepalMapEngine | null = null;
    // PixiJS needs the browser, so it is loaded only here.
    void import("../lib/map-engine").then(async ({ NepalMapEngine }) => {
      const created = new NepalMapEngine();
      await created.init(host, data, { onSelect: setSelected });
      if (cancelled) {
        created.destroy();
        return;
      }
      created.setLayers(layersRef.current);
      engine = created;
      engineRef.current = created;
    });
    return () => {
      cancelled = true;
      engine?.destroy();
      engineRef.current = null;
    };
  }, [data]);

  const searchable = useMemo(
    () => (data?.features ?? []).filter((f) => f.properties.kind !== "COUNTRY_BOUNDARY"),
    [data],
  );

  function toggleLayer(key: keyof MapLayers) {
    const next = { ...layersRef.current, [key]: !layersRef.current[key] };
    layersRef.current = next;
    setLayers(next);
    engineRef.current?.setLayers(next);
  }

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-5 px-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] tracking-wide text-accent uppercase">The Himalayas are calling</p>
          <h1 className="font-display text-4xl font-semibold sm:text-5xl">Big mountains. Little hops.</h1>
          <p className="text-muted">Explore Nepal like a game. Plan your trek for the real world.</p>
        </div>
        <MapSearch features={searchable} onPick={(f) => engineRef.current?.select(f.id, true)} />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Map layers">
        {LAYER_CHIPS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            aria-pressed={layers[key]}
            onClick={() => toggleLayer(key)}
            className={cn(
              "h-9 px-4 text-sm transition-colors",
              layers[key] ? "bg-foreground text-background" : "bg-surface-muted hover:bg-border-soft",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <section className="relative h-[calc(100dvh-380px)] min-h-[460px] overflow-hidden border border-border bg-[#f1ebdc]">
        <div ref={hostRef} className="absolute inset-0" />

        {!data && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-muted">
            {failed ? (
              <>
                <p>We couldn&apos;t load the map data. Is the API running?</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFailed(false);
                    setAttempt((n) => n + 1);
                  }}
                >
                  Try again
                </Button>
              </>
            ) : (
              <p>Unfolding the map…</p>
            )}
          </div>
        )}

        {data && (
          <>
            <p className="pointer-events-none absolute top-3 left-3 bg-surface px-3 py-1.5 font-mono text-[11px] uppercase">
              Nepal / Adventure map
            </p>

            <div className="absolute top-3 right-3 flex flex-col border border-border bg-surface">
              <button type="button" aria-label="Zoom in" onClick={() => engineRef.current?.zoomBy(1.6)} className="h-10 w-10 text-xl hover:bg-surface-muted">
                +
              </button>
              <button type="button" aria-label="Zoom out" onClick={() => engineRef.current?.zoomBy(1 / 1.6)} className="h-10 w-10 border-t border-border text-xl hover:bg-surface-muted">
                −
              </button>
            </div>

            <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)]">
              {selected ? (
                <FeatureCard feature={selected} onClose={() => engineRef.current?.select(null, false)} />
              ) : (
                <div className="w-[min(320px,100%)] border border-border bg-surface p-5 shadow-md">
                  <Tag className="bg-primary/30 text-foreground">Your next chapter</Tag>
                  <h2 className="mt-3 font-display text-3xl leading-tight font-semibold">
                    Let&apos;s explore
                    <br />
                    the Himalayas!
                  </h2>
                  <p className="mt-2 text-sm text-muted">
                    Drag the map, scroll to zoom and tap a highlighted peak to see how high it is.
                  </p>
                  <Button className="mt-4 w-full" onClick={() => engineRef.current?.focusTrails((n) => /annapurna/i.test(n))}>
                    Start with Annapurna →
                  </Button>
                </div>
              )}
            </div>

            <p className="absolute right-3 bottom-3 max-w-[45%] bg-surface/90 px-2 py-1 text-right text-[10px] text-muted">
              {data.sources.map((source, index) => (
                <span key={source.key}>
                  {index > 0 && " · "}
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {source.attribution}
                  </a>
                </span>
              ))}
              {layers.terrain && (
                <>
                  {" · "}
                  <a href={TERRAIN_ATTRIBUTION.url} target="_blank" rel="noopener noreferrer" className="underline">
                    {TERRAIN_ATTRIBUTION.text}
                  </a>
                </>
              )}
            </p>
          </>
        )}
      </section>

      <p className="text-xs text-muted">
        Real peaks, cities and trails from open map data. Some trails are only partly mapped, and nothing here is live
        trail advice.
      </p>
    </main>
  );
}

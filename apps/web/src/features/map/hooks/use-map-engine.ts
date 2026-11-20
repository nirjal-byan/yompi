"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GeoFeature, GeoFeatureCollection } from "@yompi/shared";
import { ALL_LAYERS_ON } from "../lib/engine/layers";
import type { MapLayers, NepalMapEngine } from "../lib/map-engine";
import { getGeoFeatures } from "../services/geo-api";

export function useMapEngine() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NepalMapEngine | null>(null);
  const layersRef = useRef<MapLayers>(ALL_LAYERS_ON);

  const [data, setData] = useState<GeoFeatureCollection | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [layers, setLayers] = useState<MapLayers>(ALL_LAYERS_ON);
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

  const searchableFeatures = useMemo(
    () =>
      (data?.features ?? []).filter((feature) => feature.properties.kind !== "COUNTRY_BOUNDARY"),
    [data],
  );

  function toggleLayer(key: keyof MapLayers) {
    const next = { ...layersRef.current, [key]: !layersRef.current[key] };
    layersRef.current = next;
    setLayers(next);
    engineRef.current?.setLayers(next);
  }

  function retry() {
    setFailed(false);
    setAttempt((count) => count + 1);
  }

  return {
    hostRef,
    data,
    failed,
    retry,
    layers,
    toggleLayer,
    selected,
    searchableFeatures,
    selectFeature: (id: string) => engineRef.current?.select(id, true),
    clearSelection: () => engineRef.current?.select(null, false),
    zoomBy: (factor: number) => engineRef.current?.zoomBy(factor),
    focusTrails: (matches: (name: string) => boolean) => engineRef.current?.focusTrails(matches),
  };
}

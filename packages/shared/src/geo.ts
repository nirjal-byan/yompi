import { z } from "zod";

export const GeoFeatureKindSchema = z.enum([
  "COUNTRY_BOUNDARY",
  "PEAK",
  "CITY",
  "GATEWAY",
  "TRAIL",
  "LAKE",
  "PASS",
]);
export type GeoFeatureKind = z.infer<typeof GeoFeatureKindSchema>;

/** Comma separated kinds, e.g. "PEAK,CITY". Empty or missing means "all kinds". */
export const GeoKindQuerySchema = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").map((part) => part.trim().toUpperCase()) : []))
  .pipe(z.array(GeoFeatureKindSchema));

/** A GeoJSON geometry in WGS84 (longitude, latitude). */
export interface GeoJsonGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoSource {
  key: string;
  name: string;
  url: string;
  license: string;
  attribution: string;
}

export interface GeoFeatureProperties {
  kind: GeoFeatureKind;
  name: string;
  nameLocal: string | null;
  elevationM: number | null;
  /** Extra source data, e.g. a trail's mapped length (computedKm) vs OSM's listed length (osmDistanceKm). */
  details: Record<string, unknown> | null;
  sourceKey: string;
  sourceRef: string;
}

export interface GeoFeature {
  type: "Feature";
  id: string;
  geometry: GeoJsonGeometry;
  properties: GeoFeatureProperties;
}

/** `sources` lists every dataset used, so the UI can show the required attribution. */
export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
  sources: GeoSource[];
}

/** One continuous mapped stretch of a trail. Elevations are metres, spaced `spacingKm` apart. */
export interface TrailProfileSection {
  lengthKm: number;
  elevationsM: number[];
}

/** Real elevation profile computed from open elevation data (see `method`). */
export interface TrailProfile {
  method: string;
  spacingKm: number;
  sections: TrailProfileSection[];
  highestM: number;
  /** [longitude, latitude] of the highest sampled point. */
  highestAt: [number, number];
  lowestM: number;
  ascentM: number;
  descentM: number;
}

export interface NearbyFeature {
  id: string;
  kind: GeoFeatureKind;
  name: string;
  elevationM: number | null;
  /** Straight-line distance from the trail, in kilometres. */
  distanceKm: number;
}

/** Everything the UI needs to describe one feature in detail. */
export interface FeatureDetail {
  feature: GeoFeature;
  profile: TrailProfile | null;
  nearby: NearbyFeature[];
  sources: GeoSource[];
}

export const FeatureIdSchema = z.string().uuid();

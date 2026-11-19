import { z } from "zod";

export const GeoFeatureKindSchema = z.enum([
  "COUNTRY_BOUNDARY",
  "PEAK",
  "CITY",
  "GATEWAY",
  "TRAIL",
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

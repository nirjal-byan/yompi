import { z } from "zod";
import type { TrekInfo } from "./trek-data.js";

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

export const GeoKindQuerySchema = z
  .string()
  .optional()
  .transform((value) => (value ? value.split(",").map((part) => part.trim().toUpperCase()) : []))
  .pipe(z.array(GeoFeatureKindSchema));

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

export interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
  sources: GeoSource[];
}

export interface TrailProfileSection {
  lengthKm: number;
  elevationsM: number[];
}

export interface TrailProfile {
  method: string;
  spacingKm: number;
  sections: TrailProfileSection[];
  highestM: number;

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

  distanceKm: number;
}

export interface FeatureDetail {
  feature: GeoFeature;
  profile: TrailProfile | null;
  nearby: NearbyFeature[];
  sources: GeoSource[];

  trek: TrekInfo | null;
}

export const FeatureIdSchema = z.string().uuid();

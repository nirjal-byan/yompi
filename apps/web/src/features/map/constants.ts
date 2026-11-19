import type { GeoFeatureKind } from "@yompi/shared";

export const KIND_LABEL: Record<GeoFeatureKind, string> = {
  COUNTRY_BOUNDARY: "Country",
  PEAK: "Peak",
  CITY: "City",
  GATEWAY: "Gateway",
  TRAIL: "Trail",
};

export const METERS_TO_FEET = 3.28084;

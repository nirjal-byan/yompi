import type { GeoFeatureKind } from "@yompi/shared";

export const KIND_LABEL: Record<GeoFeatureKind, string> = {
  COUNTRY_BOUNDARY: "Country",
  PEAK: "Peak",
  CITY: "City",
  GATEWAY: "Gateway",
  TRAIL: "Trail",
  LAKE: "Lake",
  PASS: "Pass",
};

export const METERS_TO_FEET = 3.28084;

export const TERRAIN_ATTRIBUTION = {
  text: "Terrain: SRTM & GMTED2010 (NASA/USGS) via AWS Terrain Tiles",
  url: "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
};

export const PERMIT_UNIT_LABEL: Record<string, string> = {
  PER_PERSON: "per person",
  PER_PERSON_PER_DAY: "per person per day",
  PER_GROUP: "per group",
};

export const COST_UNIT_LABEL: Record<string, string> = {
  PER_DAY: "per day",
  PER_NIGHT: "per night",
  PER_PERSON: "per person",
  PER_TRIP: "per trip",
};

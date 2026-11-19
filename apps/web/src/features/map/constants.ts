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

/** Required credit for the elevation tiles that drive the terrain layer. */
export const TERRAIN_ATTRIBUTION = {
  text: "Terrain: SRTM & GMTED2010 (NASA/USGS) via AWS Terrain Tiles",
  url: "https://github.com/tilezen/joerd/blob/master/docs/attribution.md",
};

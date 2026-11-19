import type { GeoFeatureCollection } from "@yompi/shared";
import { API_URL } from "@/lib/config";

export async function getGeoFeatures(): Promise<GeoFeatureCollection> {
  const res = await fetch(`${API_URL}/geo/features`);
  if (!res.ok) throw new Error(`Geo request failed with ${res.status}`);
  return (await res.json()) as GeoFeatureCollection;
}

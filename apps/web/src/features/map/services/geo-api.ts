import type { GeoFeatureCollection } from "@yompi/shared";
import { API_URL } from "@/lib/config";

export async function getGeoFeatures(): Promise<GeoFeatureCollection> {
  // Always ask the server: map data changes with imports, and a stale browser copy shows removed places.
  const res = await fetch(`${API_URL}/geo/features`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Geo request failed with ${res.status}`);
  return (await res.json()) as GeoFeatureCollection;
}

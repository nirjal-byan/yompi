import type { TrekInfo, TrekSummary } from "@yompi/shared";
import { API_URL } from "@/lib/config";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Request to ${path} failed with ${response.status}`);

  return (await response.json()) as T;
}

export function getTreks(): Promise<TrekSummary[]> {
  return getJson<TrekSummary[]>("/treks");
}

export function getTrekInfo(slug: string): Promise<TrekInfo> {
  return getJson<TrekInfo>(`/treks/${slug}`);
}

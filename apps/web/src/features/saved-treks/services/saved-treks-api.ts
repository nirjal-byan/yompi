import { API_URL } from "@/lib/config";

const ENDPOINT = `${API_URL}/me/saved-treks`;
const UNAUTHORIZED = 401;

export async function fetchSavedSlugs(init: RequestInit): Promise<string[] | null> {
  const response = await fetch(ENDPOINT, { ...init, cache: "no-store" });
  if (response.status === UNAUTHORIZED) return null;
  if (!response.ok) throw new Error(`Saved treks request failed with ${response.status}`);

  return (await response.json()) as string[];
}

export async function setTrekSaved(slug: string, saved: boolean): Promise<void> {
  const response = await fetch(`${ENDPOINT}/${encodeURIComponent(slug)}`, {
    method: saved ? "PUT" : "DELETE",
    credentials: "include",
  });
  if (!response.ok) throw new Error(`Saving the trek failed with ${response.status}`);
}

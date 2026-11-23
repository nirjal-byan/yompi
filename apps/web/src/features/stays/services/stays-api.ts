import type { StayInfo } from "@yompi/shared";
import { API_URL } from "@/lib/config";

export async function getStays(): Promise<StayInfo[]> {
  const response = await fetch(`${API_URL}/stays`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Stays request failed with ${response.status}`);

  return (await response.json()) as StayInfo[];
}

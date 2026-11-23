import type { ConditionInfo } from "@yompi/shared";
import { API_URL } from "@/lib/config";

export async function getConditions(): Promise<ConditionInfo[]> {
  const response = await fetch(`${API_URL}/conditions`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Conditions request failed with ${response.status}`);

  return (await response.json()) as ConditionInfo[];
}

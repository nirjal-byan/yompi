import { API_URL } from "@/lib/config";
import type { HealthStatus } from "../types";

export async function getHealth(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    return (await res.json()) as HealthStatus;
  } catch {
    return null;
  }
}

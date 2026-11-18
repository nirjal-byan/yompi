import { getHealth } from "../services/health-api";

export async function ApiStatus() {
  const health = await getHealth();
  const label = health ? `${health.status} (database: ${health.database})` : "unreachable";
  return <p className="text-sm text-zinc-600">API: {label}</p>;
}

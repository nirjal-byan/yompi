import type { CostBasis, TrekSummary } from "@yompi/shared";

export function formatDays({ minDays, maxDays }: Pick<TrekSummary, "minDays" | "maxDays">): string {
  return minDays === maxDays ? `${minDays} days` : `${minDays}–${maxDays} days`;
}

export function formatRoute({ startPlace, endPlace }: TrekSummary): string | null {
  const places = [startPlace, endPlace].filter(Boolean);

  return places.length ? places.join(" → ") : null;
}

export function formatNpr(amount: number): string {
  return `NPR ${amount.toLocaleString("en-US")}`;
}

export function formatMetres(metres: number): string {
  return `${metres.toLocaleString("en-US")} m`;
}

export function formatEstimate(
  trek: Pick<TrekSummary, "estimatedCostNpr" | "costBasis">,
): string | null {
  if (!trek.estimatedCostNpr) return null;
  const amount = `${formatNpr(trek.estimatedCostNpr)} / person`;

  return trek.costBasis === "PERMITS_ONLY" ? `Permits ${amount}` : `From ${amount}`;
}

export const ESTIMATE_LABEL: Record<CostBasis, string> = {
  PERMITS_ONLY: "Permit fees",
  PERMITS_AND_DAILY_COSTS: "Permits, food and lodging",
};

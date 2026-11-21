import type { TrekSummary } from "@yompi/shared";

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

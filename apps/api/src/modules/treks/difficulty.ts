import type { DifficultyEstimate, DifficultyFactor } from "@yompi/shared";

export interface DifficultyInput {
  highestPointM: number | null;

  maxDays: number;

  highPassCount: number;
}

const MAX_POINTS = 8;

const CAVEAT =
  "An estimate from altitude, duration and high passes only. It does not account for technical terrain, " +
  "season, weather or personal fitness. Check with a guide or trekking agency before planning.";

function altitudePoints(metres: number): number {
  if (metres < 2500) return 0;
  if (metres < 3500) return 1;
  if (metres < 4500) return 2;
  if (metres < 5300) return 3;
  return 4;
}

function durationPoints(days: number): number {
  if (days <= 4) return 0;
  if (days <= 9) return 1;
  if (days <= 15) return 2;
  return 3;
}

function starsFor(points: number): DifficultyEstimate["stars"] {
  if (points <= 1) return 1;
  if (points <= 3) return 2;
  if (points <= 5) return 3;
  if (points <= 7) return 4;
  return 5;
}

export function estimateDifficulty(input: DifficultyInput): DifficultyEstimate | null {
  if (input.highestPointM === null) return null;

  const altitude = altitudePoints(input.highestPointM);
  const duration = durationPoints(input.maxDays);
  const passes = input.highPassCount > 0 ? 1 : 0;

  const factors: DifficultyFactor[] = [
    {
      label: "Altitude",
      detail: `Highest point ${input.highestPointM.toLocaleString("en-US")} m`,
      points: altitude,
    },
    { label: "Duration", detail: `Up to ${input.maxDays} days`, points: duration },
    {
      label: "High passes",
      detail:
        passes > 0
          ? `Crosses ${input.highPassCount} pass${input.highPassCount > 1 ? "es" : ""} above 5,000 m`
          : "No pass above 5,000 m on the route",
      points: passes,
    },
  ];
  const points = altitude + duration + passes;
  return { stars: starsFor(points), points, maxPoints: MAX_POINTS, factors, caveat: CAVEAT };
}

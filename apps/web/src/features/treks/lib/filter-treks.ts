import type { TrekSummary } from "@yompi/shared";

const COST_STEP_NPR = 1000;
const ALTITUDE_STEP_M = 100;

export interface TrekBounds {
  regions: string[];
  maxCostNpr: number;
  maxAltitudeM: number;
}

export interface TrekFilters {
  regions: string[];
  maxCostNpr: number;
  maxAltitudeM: number;
}

function roundUp(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

export function getBounds(treks: TrekSummary[]): TrekBounds {
  return {
    regions: [...new Set(treks.map((trek) => trek.region))].sort(),
    maxCostNpr: roundUp(
      Math.max(0, ...treks.map((trek) => trek.estimatedCostNpr ?? 0)),
      COST_STEP_NPR,
    ),
    maxAltitudeM: roundUp(
      Math.max(0, ...treks.map((trek) => trek.highestPointM ?? 0)),
      ALTITUDE_STEP_M,
    ),
  };
}

export function defaultFilters({ maxCostNpr, maxAltitudeM }: TrekBounds): TrekFilters {
  return { regions: [], maxCostNpr, maxAltitudeM };
}

function withinLimit(value: number | null, limit: number, bound: number): boolean {
  if (limit >= bound) return true;

  return value !== null && value <= limit;
}

export function applyFilters(
  treks: TrekSummary[],
  filters: TrekFilters,
  bounds: TrekBounds,
): TrekSummary[] {
  return treks.filter(
    (trek) =>
      (filters.regions.length === 0 || filters.regions.includes(trek.region)) &&
      withinLimit(trek.estimatedCostNpr, filters.maxCostNpr, bounds.maxCostNpr) &&
      withinLimit(trek.highestPointM, filters.maxAltitudeM, bounds.maxAltitudeM),
  );
}

export const FILTER_STEPS = { cost: COST_STEP_NPR, altitude: ALTITUDE_STEP_M };

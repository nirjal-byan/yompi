import type { CostCategory, CostUnit, PermitUnit } from "@yompi/shared";

export interface PermitAmount {
  amountNpr: number;
  unit: PermitUnit;
}

export interface CostAmount {
  category: CostCategory;
  amountNpr: number;
  unit: CostUnit;
  specific: boolean;
}

interface CostEstimateInput {
  days: number;
  permits: PermitAmount[];
  costs: CostAmount[];
}

function permitTotal(permits: PermitAmount[], days: number): number {
  return permits.reduce((total, { amountNpr, unit }) => {
    if (unit === "PER_PERSON") return total + amountNpr;
    if (unit === "PER_PERSON_PER_DAY") return total + amountNpr * days;

    return total;
  }, 0);
}

function pickRate(costs: CostAmount[], category: CostCategory, unit: CostUnit): number {
  const matching = costs.filter((cost) => cost.category === category && cost.unit === unit);
  const preferred = matching.find((cost) => cost.specific) ?? matching[0];

  return preferred?.amountNpr ?? 0;
}

export function estimateCostPerPerson({ days, permits, costs }: CostEstimateInput): number | null {
  const nights = Math.max(days - 1, 0);
  const total =
    permitTotal(permits, days) +
    pickRate(costs, "FOOD_DAILY", "PER_DAY") * days +
    pickRate(costs, "LODGING_BUDGET", "PER_NIGHT") * nights;

  return total > 0 ? total : null;
}

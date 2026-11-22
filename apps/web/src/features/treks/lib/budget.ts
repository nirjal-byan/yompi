import type {
  AccommodationTier,
  CostCategory,
  CostInfo,
  CostUnit,
  PermitInfo,
} from "@yompi/shared";

export interface BudgetInput {
  groupSize: number;
  days: number;
  tier: AccommodationTier;
  includeGuide: boolean;
  porters: number;
}

export interface BudgetLine {
  label: string;
  amountNpr: number | null;
}

export interface Budget {
  lines: BudgetLine[];
  totalNpr: number;
  perPersonNpr: number;
  missing: string[];
}

const LODGING_CATEGORY: Record<AccommodationTier, CostCategory> = {
  BUDGET: "LODGING_BUDGET",
  STANDARD: "LODGING_STANDARD",
  COMFORT: "LODGING_COMFORT",
};

export const TIER_LABEL: Record<AccommodationTier, string> = {
  BUDGET: "Budget",
  STANDARD: "Standard",
  COMFORT: "Comfort",
};

function findRate(costs: CostInfo[], category: CostCategory, unit: CostUnit): number | null {
  const matching = costs.filter((cost) => cost.category === category && cost.unit === unit);
  const preferred = matching.find((cost) => cost.specific) ?? matching[0];

  return preferred?.amountNpr ?? null;
}

function permitsTotal(permits: PermitInfo[], { groupSize, days }: BudgetInput): number {
  return permits.reduce((total, { amountNpr, unit }) => {
    if (unit === "PER_PERSON") return total + amountNpr * groupSize;
    if (unit === "PER_PERSON_PER_DAY") return total + amountNpr * groupSize * days;

    return total + amountNpr;
  }, 0);
}

function times(rate: number | null, quantity: number): number | null {
  return rate === null ? null : rate * quantity;
}

function transportTotal(costs: CostInfo[], groupSize: number): number | null {
  const perPerson = times(findRate(costs, "TRANSPORT", "PER_PERSON"), groupSize);
  const perTrip = findRate(costs, "TRANSPORT", "PER_TRIP");
  if (perPerson === null && perTrip === null) return null;

  return (perPerson ?? 0) + (perTrip ?? 0);
}

export function calculateBudget(
  input: BudgetInput,
  permits: PermitInfo[],
  costs: CostInfo[],
): Budget {
  const { groupSize, days, tier, includeGuide, porters } = input;
  const nights = Math.max(days - 1, 0);

  const lines: BudgetLine[] = [
    { label: "Permits and fees", amountNpr: permits.length ? permitsTotal(permits, input) : null },
    {
      label: `${TIER_LABEL[tier]} lodging`,
      amountNpr: times(findRate(costs, LODGING_CATEGORY[tier], "PER_NIGHT"), nights * groupSize),
    },
    {
      label: "Food",
      amountNpr: times(findRate(costs, "FOOD_DAILY", "PER_DAY"), days * groupSize),
    },
    { label: "Transport", amountNpr: transportTotal(costs, groupSize) },
  ];

  if (includeGuide) {
    lines.push({
      label: "Guide",
      amountNpr: times(findRate(costs, "GUIDE_DAILY", "PER_DAY"), days),
    });
  }
  if (porters > 0) {
    lines.push({
      label: `${porters} ${porters === 1 ? "porter" : "porters"}`,
      amountNpr: times(findRate(costs, "PORTER_DAILY", "PER_DAY"), days * porters),
    });
  }

  const totalNpr = lines.reduce((sum, line) => sum + (line.amountNpr ?? 0), 0);

  return {
    lines,
    totalNpr,
    perPersonNpr: Math.round(totalNpr / groupSize),
    missing: lines.filter((line) => line.amountNpr === null).map((line) => line.label),
  };
}

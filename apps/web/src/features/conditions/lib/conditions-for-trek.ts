import type { ConditionInfo } from "@yompi/shared";

export function conditionsForTrek(conditions: ConditionInfo[], trekSlug: string): ConditionInfo[] {
  const specific = conditions.filter((condition) => condition.trekSlug === trekSlug);
  const general = conditions.filter((condition) => condition.trekSlug === null);

  return [...specific, ...general];
}

import { describe, expect, it } from "vitest";
import { estimateCostPerPerson } from "./trek-cost.js";

describe("estimateCostPerPerson", () => {
  it("adds permits, food and budget lodging for the minimum days", () => {
    const estimate = estimateCostPerPerson({
      days: 7,
      permits: [
        { amountNpr: 3000, unit: "PER_PERSON" },
        { amountNpr: 100, unit: "PER_PERSON_PER_DAY" },
        { amountNpr: 9999, unit: "PER_GROUP" },
      ],
      costs: [
        { category: "FOOD_DAILY", amountNpr: 2000, unit: "PER_DAY", specific: false },
        { category: "LODGING_BUDGET", amountNpr: 500, unit: "PER_NIGHT", specific: false },
      ],
    });

    expect(estimate).toBe(3000 + 700 + 14000 + 3000);
  });

  it("prefers the trek specific rate", () => {
    const estimate = estimateCostPerPerson({
      days: 2,
      permits: [],
      costs: [
        { category: "FOOD_DAILY", amountNpr: 1000, unit: "PER_DAY", specific: false },
        { category: "FOOD_DAILY", amountNpr: 3000, unit: "PER_DAY", specific: true },
      ],
    });

    expect(estimate).toBe(6000);
  });

  it("returns null when nothing is sourced", () => {
    expect(estimateCostPerPerson({ days: 5, permits: [], costs: [] })).toBeNull();
  });
});

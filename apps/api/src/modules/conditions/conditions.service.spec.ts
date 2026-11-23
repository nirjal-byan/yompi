import { describe, expect, it } from "vitest";
import { isConditionStale } from "./conditions.service.js";

describe("isConditionStale", () => {
  const now = new Date("2026-11-30");

  it("keeps a recent report fresh", () => {
    expect(isConditionStale(new Date("2026-11-10"), now)).toBe(false);
  });

  it("flags a report older than 30 days", () => {
    expect(isConditionStale(new Date("2026-10-01"), now)).toBe(true);
  });
});

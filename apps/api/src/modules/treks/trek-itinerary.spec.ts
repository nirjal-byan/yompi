import { describe, expect, it } from "vitest";
import { staysForPlace } from "./trek-itinerary.js";

const stays = [
  {
    name: "Himalaya Lodge",
    place: "Namche Bazaar",
    tier: "BUDGET" as const,
    pricePerNightNpr: null,
  },
  { name: "Summit Inn", place: "Lukla", tier: "STANDARD" as const, pricePerNightNpr: 2000 },
];

describe("staysForPlace", () => {
  it("matches the overnight place ignoring case and spacing", () => {
    expect(staysForPlace(stays, "  namche bazaar ")).toEqual([
      { name: "Himalaya Lodge", tier: "BUDGET", pricePerNightNpr: null },
    ]);
  });

  it("returns nothing when there is no overnight place", () => {
    expect(staysForPlace(stays, null)).toEqual([]);
  });
});

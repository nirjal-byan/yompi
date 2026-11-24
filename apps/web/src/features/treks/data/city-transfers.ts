export type StartCity = "KATHMANDU" | "POKHARA";

export const START_CITIES: Array<{ value: StartCity; label: string }> = [
  { value: "KATHMANDU", label: "Kathmandu" },
  { value: "POKHARA", label: "Pokhara" },
];

export const CITY_TRANSFER = {
  options: [
    { mode: "Tourist bus", duration: "6-7 hours officially, often 8-10 hours in practice" },
    { mode: "Flight", duration: "25-30 minutes" },
  ],
  source: {
    name: "In Your Pocket: Getting from Kathmandu to Pokhara",
    url: "https://www.inyourpocket.com/nepal/pokhara/articles/getting-from-kathmandu-to-pokhara/",
    verifiedAt: "2026-11-24",
    stale: false,
  },
};

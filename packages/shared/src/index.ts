import { z } from "zod";

export const AccommodationTierSchema = z.enum(["BUDGET", "STANDARD", "COMFORT"]);
export type AccommodationTier = z.infer<typeof AccommodationTierSchema>;

export const BudgetCalculationInputSchema = z.object({
  destinationId: z.string().uuid(),
  groupSize: z.number().int().min(1).max(30),
  days: z.number().int().min(1).max(45),
  accommodationTier: AccommodationTierSchema,
  includeGuide: z.boolean().default(true),
  portersCount: z.number().int().min(0).max(20).default(0),
});

export type BudgetCalculationInput = z.infer<typeof BudgetCalculationInputSchema>;

export interface BudgetBreakdown {
  totalNpr: number;
  perPersonNpr: number;
  items: {
    accommodationNpr: number;
    foodNpr: number;
    permitsNpr: number;
    transportNpr: number;
    guideNpr: number;
    porterNpr: number;
  };
}
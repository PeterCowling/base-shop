import { z } from "zod";

/** Zod schema describing a meal plan object. */
export const mealPlanSchema = z
  .object({
    level: z.string().optional(),
    type: z.string().optional(),
  })
  .strict();

export type MealPlan = z.infer<typeof mealPlanSchema>;

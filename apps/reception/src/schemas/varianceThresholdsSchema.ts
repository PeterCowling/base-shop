import { z } from "zod";

export const varianceThresholdsSchema = z.object({
  cash: z.number().min(0).optional(),
  keycards: z.number().int().min(0).optional(),
});

export type VarianceThresholds = z.infer<typeof varianceThresholdsSchema>;

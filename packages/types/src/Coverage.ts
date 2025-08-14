import { z } from "zod";

export const coverageCodeSchema = z.enum(["scuff", "tear", "lost"]);

export const coverageRuleSchema = z
  .object({
    fee: z.number().nonnegative(),
    waiver: z.number().nonnegative(),
  })
  .strict();

export const coverageSchema = z.record(coverageCodeSchema, coverageRuleSchema);

export type CoverageCode = z.infer<typeof coverageCodeSchema>;
export type CoverageRule = z.infer<typeof coverageRuleSchema>;
export type CoverageMatrix = z.infer<typeof coverageSchema>;

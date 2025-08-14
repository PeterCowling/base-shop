import { z } from "zod";

export const coverageTypeSchema = z.enum(["scuff", "tear", "lost"]);
export type CoverageType = z.infer<typeof coverageTypeSchema>;

export const coverageRuleSchema = z.object({
  fee: z.number(),
  waiver: z.union([z.number(), z.literal("deposit")]),
});
export type CoverageRule = z.infer<typeof coverageRuleSchema>;

export const defaultCoverage: Record<CoverageType, CoverageRule> = {
  scuff: { fee: 5, waiver: 20 },
  tear: { fee: 10, waiver: 50 },
  lost: { fee: 15, waiver: "deposit" },
};

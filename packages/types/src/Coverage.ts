import { z } from "zod";

export enum CoverageCode {
  Scuff = "scuff",
  Tear = "tear",
  Lost = "lost",
}

export const coverageFees: Record<CoverageCode, number> = {
  [CoverageCode.Scuff]: 5,
  [CoverageCode.Tear]: 15,
  [CoverageCode.Lost]: 60,
};

export const coverageWaivers: Record<CoverageCode, number | "deposit"> = {
  [CoverageCode.Scuff]: 20,
  [CoverageCode.Tear]: 50,
  [CoverageCode.Lost]: "deposit",
};

export const coverageSchema = z.object({
  fees: z.record(z.number()),
  waivers: z.record(z.union([z.number(), z.literal("deposit")])),
});

export type Coverage = z.infer<typeof coverageSchema>;

import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface SocialProofComponent extends PageComponentBase {
  type: "SocialProof";
  source?: string;
  frequency?: number;
}

export const socialProofComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialProof"),
  source: z.string().optional(),
  frequency: z.number().optional(),
});

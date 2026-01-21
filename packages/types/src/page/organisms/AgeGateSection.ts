import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface AgeGateSectionComponent extends PageComponentBase {
  type: "AgeGateSection";
  minAge?: number;
  message?: string;
  confirmLabel?: string;
  storageKey?: string;
  rememberDays?: number;
}

export const ageGateSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("AgeGateSection"),
  minAge: z.number().int().positive().optional(),
  message: z.string().optional(),
  confirmLabel: z.string().optional(),
  storageKey: z.string().optional(),
  rememberDays: z.number().int().positive().optional(),
});


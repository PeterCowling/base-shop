import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "../base";

export interface DSARSectionComponent extends PageComponentBase {
  type: "DSARSection";
  headline?: string;
  explanation?: string;
}

export const dsarSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("DSARSection"),
  headline: z.string().optional(),
  explanation: z.string().optional(),
});


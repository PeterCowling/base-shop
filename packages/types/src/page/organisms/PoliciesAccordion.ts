import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface PoliciesAccordionComponent extends PageComponentBase {
  type: "PoliciesAccordion";
  shipping?: string;
  returns?: string;
  warranty?: string;
}

export const policiesAccordionComponentSchema = baseComponentSchema.extend({
  type: z.literal("PoliciesAccordion"),
  shipping: z.string().optional(),
  returns: z.string().optional(),
  warranty: z.string().optional(),
});


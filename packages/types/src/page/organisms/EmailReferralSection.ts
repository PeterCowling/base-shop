import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface EmailReferralSectionComponent extends PageComponentBase {
  type: "EmailReferralSection";
  headline?: string;
  subtitle?: string;
  giveLabel?: string;
  getLabel?: string;
  termsHref?: string;
}

export const emailReferralSectionComponentSchema = baseComponentSchema.extend({
  type: z.literal("EmailReferralSection"),
  headline: z.string().optional(),
  subtitle: z.string().optional(),
  giveLabel: z.string().optional(),
  getLabel: z.string().optional(),
  termsHref: z.string().optional(),
});


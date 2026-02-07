import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface SocialLinksComponent extends PageComponentBase {
  type: "SocialLinks";
  facebook?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
}

export const socialLinksComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialLinks"),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  x: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
});


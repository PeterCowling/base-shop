import { z } from "zod";

import { baseComponentSchema, type PageComponentBase } from "../base";

export interface CertificateCheckComponent extends PageComponentBase {
  type: "CertificateCheck";
  productId?: string;
  placeholder?: string;
}

export const certificateCheckComponentSchema = baseComponentSchema.extend({
  type: z.literal("CertificateCheck"),
  productId: z.string().optional(),
  placeholder: z.string().optional(),
});


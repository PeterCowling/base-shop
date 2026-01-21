import { z } from "zod";

import { formDataToObject } from "../../../utils/formData";

const returnsSchema = z
  .object({
    enabled: z.preprocess(
      (v) => (v === undefined ? false : v === "on" ? true : v),
      z.boolean(),
    ),
    bagEnabled: z
      .preprocess(
        (v) => (v === undefined ? undefined : v === "on" ? true : v),
        z.boolean(),
      )
      .optional(),
    homePickupEnabled: z
      .preprocess(
        (v) => (v === undefined ? undefined : v === "on" ? true : v),
        z.boolean(),
      )
      .optional(),
  })
  .strict();

export function parseUpsReturnsForm(formData: FormData): {
  data?: z.infer<typeof returnsSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = returnsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type UpsReturnsForm = z.infer<typeof returnsSchema>;

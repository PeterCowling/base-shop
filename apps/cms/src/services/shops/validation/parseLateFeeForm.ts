import { z } from "zod";

import { formDataToObject } from "../../../utils/formData";

const lateFeeSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    intervalMinutes: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1"), // i18n-exempt: schema error text used in tests; locale not available here
  })
  .strict();

export function parseLateFeeForm(formData: FormData): {
  data?: z.infer<typeof lateFeeSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = lateFeeSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type LateFeeForm = z.infer<typeof lateFeeSchema>;

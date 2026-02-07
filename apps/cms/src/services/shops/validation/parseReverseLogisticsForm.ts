import { z } from "zod";

import { formDataToObject } from "../../../utils/formData";

const reverseLogisticsSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    intervalMinutes: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1"), // i18n-exempt: schema error text used in tests; locale not available here
  })
  .strict();

export function parseReverseLogisticsForm(formData: FormData): {
  data?: z.infer<typeof reverseLogisticsSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = reverseLogisticsSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type ReverseLogisticsForm = z.infer<typeof reverseLogisticsSchema>;

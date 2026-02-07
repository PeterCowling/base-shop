import { z } from "zod";

import { formDataToObject } from "../../../utils/formData";

const currencyTaxSchema = z
  .object({
    currency: z.string().length(3, "Required"),
    taxRegion: z.string().min(1, "Required"),
  })
  .strip();

export function parseCurrencyTaxForm(formData: FormData): {
  data?: z.infer<typeof currencyTaxSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = currencyTaxSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type CurrencyTaxForm = z.infer<typeof currencyTaxSchema>;

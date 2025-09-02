import { z } from "zod";
import { formDataToObject } from "../../../utils/formData";

const depositSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    intervalMinutes: z.coerce.number().int().min(1, "Must be at least 1"),
  })
  .strict();

export function parseDepositForm(formData: FormData): {
  data?: z.infer<typeof depositSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = depositSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type DepositForm = z.infer<typeof depositSchema>;

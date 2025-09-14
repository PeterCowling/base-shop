import { z } from "zod";
import { formDataToObject } from "../../../utils/formData";

const schedulerSchema = z
  .object({
    intervalMinutes: z.coerce.number().int().min(1, "Must be at least 1"),
  })
  .strict();

export function parseStockSchedulerForm(formData: FormData): {
  data?: z.infer<typeof schedulerSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = schedulerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type StockSchedulerForm = z.infer<typeof schedulerSchema>;

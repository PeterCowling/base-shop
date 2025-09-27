import { z } from "zod";

  const stockAlertFormSchema = z
    .object({
      recipients: z.array(z.string().email()).nonempty(),
      webhook: z.string().url().optional(),
      threshold: z.coerce
        .number()
        .int()
        .min(1, "Must be at least 1") // i18n-exempt: schema error text used in tests; locale not available here
        .optional(),
    })
    .strict();

export function parseStockAlertForm(formData: FormData): {
  data?: z.infer<typeof stockAlertFormSchema>;
  errors?: Record<string, string[]>;
} {
  const data = {
    recipients: String(formData.get("recipients") ?? "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean),
    webhook: formData.get("webhook")?.toString().trim() || undefined,
    threshold: formData.get("threshold"),
  };
  const parsed = stockAlertFormSchema.safeParse(data);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type StockAlertForm = z.infer<typeof stockAlertFormSchema>;

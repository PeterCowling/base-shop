import { z } from "zod";

const stockAlertFormSchema = z
  .object({
    recipients: z.array(z.string().email()).nonempty(),
    webhook: z.string().url().optional(),
    threshold: z.coerce
      .number()
      .int()
      .min(1, "Must be at least 1")
      .optional(),
  })
  .strict();

export function parseStockAlertForm(formData: FormData): {
  data?: z.infer<typeof stockAlertFormSchema>;
  errors?: Record<string, string[]>;
} {
  const recipientsRaw = formData.getAll("recipients");
  const normalizedRecipients = (recipientsRaw.length > 0
    ? recipientsRaw
    : [formData.get("recipients")]
  )
    .filter((value): value is FormDataEntryValue => value !== null)
    .flatMap((value) =>
      typeof value === "string" ? value.split(",") : [value.toString()],
    )
    .map((value) => value.trim())
    .filter(Boolean);

  const data = {
    recipients: normalizedRecipients,
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

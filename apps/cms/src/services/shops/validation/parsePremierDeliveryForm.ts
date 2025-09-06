import { z } from "zod";

const premierDeliverySchema = z
  .object({
    regions: z.array(z.string().min(1)).default([]),
    windows: z.array(z.string().regex(/^\d{2}-\d{2}$/)).default([]),
    carriers: z.array(z.string().min(1)).default([]),
    surcharge: z.coerce.number().int().nonnegative().optional(),
    serviceLabel: z.string().optional(),
  })
  .strict();

export function parsePremierDeliveryForm(formData: FormData): {
  data?: z.infer<typeof premierDeliverySchema>;
  errors?: Record<string, string[]>;
} {
  const data = {
    regions: formData
      .getAll("regions")
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
    windows: formData
      .getAll("windows")
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
    carriers: formData
      .getAll("carriers")
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
    surcharge: formData.get("surcharge") ?? undefined,
    serviceLabel: formData.get("serviceLabel")?.toString().trim() || undefined,
  };
  const parsed = premierDeliverySchema.safeParse(data);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type PremierDeliveryForm = z.infer<typeof premierDeliverySchema>;

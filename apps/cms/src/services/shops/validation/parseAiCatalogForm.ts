import { z } from "zod";
import { aiCatalogFieldSchema } from "@acme/types";

const aiCatalogFormSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    pageSize: z.coerce.number().int().positive(),
    fields: z.array(aiCatalogFieldSchema).min(1, "Select at least one field"),
  })
  .strict();

export function parseAiCatalogForm(formData: FormData): {
  data?: z.infer<typeof aiCatalogFormSchema>;
  errors?: Record<string, string[]>;
} {
  const data = {
    enabled: formData.get("enabled"),
    pageSize: formData.get("pageSize"),
    fields: formData.getAll("fields"),
  };
  const parsed = aiCatalogFormSchema.safeParse(data);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type AiCatalogForm = z.infer<typeof aiCatalogFormSchema>;

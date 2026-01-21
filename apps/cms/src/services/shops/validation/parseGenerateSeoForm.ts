import { z } from "zod";

import { localeSchema } from "@acme/types";

import { formDataToObject } from "../../../utils/formData";

const generateSchema = z
  .object({
    id: z.string().min(1),
    locale: localeSchema,
    title: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export function parseGenerateSeoForm(formData: FormData): {
  data?: z.infer<typeof generateSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = generateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type GenerateSeoForm = z.infer<typeof generateSchema>;

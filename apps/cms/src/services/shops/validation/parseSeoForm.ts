import { z } from "zod";
import { localeSchema, type Locale } from "@acme/types";
import { formDataToObject } from "../../../utils/formData";

const seoSchema = z
  .object({
    locale: localeSchema,
    title: z.string().min(1, "Required"),
    description: z.string().min(1, "Required"),
    image: z.string().url().optional(),
    alt: z.string().optional(),
    canonicalBase: z.string().url().optional(),
    ogUrl: z.string().url().optional(),
    twitterCard: z
      .enum(["summary", "summary_large_image", "app", "player"])
      .optional(),
    // Structured data (temporary UI fields mapped into a JSON string)
    brand: z.string().optional().default(""),
    offers: z.string().optional().default(""),
    aggregateRating: z.string().optional().default(""),
    // Direct structuredData pass-through for future-proofing
    structuredData: z.string().optional(),
  })
  .strict();

export function parseSeoForm(formData: FormData): {
  data?: z.infer<typeof seoSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = seoSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type SeoForm = z.infer<typeof seoSchema> & { locale: Locale };

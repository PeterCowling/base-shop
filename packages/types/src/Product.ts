import { z } from "zod";

export const localeSchema = z.enum(["en", "de", "it"]);
export type Locale = z.infer<typeof localeSchema>;

export const translatedSchema = z.object({
  en: z.string(),
  de: z.string(),
  it: z.string(),
});

export type Translated = z.infer<typeof translatedSchema>;

export const productPublicationSchema = z.object({
  id: z.string(),
  sku: z.string(),
  title: translatedSchema,
  description: translatedSchema,
  price: z.number(),
  currency: z.string(),
  images: z.array(z.string()),
  status: z.union([
    z.literal("draft"),
    z.literal("active"),
    z.literal("archived"),
  ]),
  shop: z.string(),
  row_version: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  rentalTerms: z.string().optional(),
  deposit: z.number().optional(),
  /** daily rental rate in minor currency units */
  dailyRate: z.number().optional(),
  /** weekly rental rate in minor currency units */
  weeklyRate: z.number().optional(),
  /** monthly rental rate in minor currency units */
  monthlyRate: z.number().optional(),
  /** availability windows as ISO timestamps */
  availability: z
    .array(z.object({ from: z.string(), to: z.string() }))
    .optional(),
});

export type ProductPublication = z.infer<typeof productPublicationSchema>;

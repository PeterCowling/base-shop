import { z } from "zod";
import { localeSchema } from "./Product";
import { shopSeoFieldsSchema } from "./Shop";

const aiCatalogSchema = z.object({
  fields: z.array(z.string()),
  pageSize: z.number().int().positive().optional(),
});

export const shopSettingsSchema = z.object({
  languages: z.array(localeSchema).readonly(),
  seo: z
    .object({
      aiCatalog: aiCatalogSchema.optional(),
    })
    .catchall(shopSeoFieldsSchema),
  analytics: z
    .object({
      enabled: z.boolean().optional(),
      provider: z.string(),
      id: z.string().optional(),
    })
    .optional(),
  freezeTranslations: z.boolean().optional(),
  /** ISO currency code used as the shop's base currency */
  currency: z.string().length(3).optional(),
  /** Region identifier for tax calculations */
  taxRegion: z.string().optional(),
  depositService: z
    .object({
      enabled: z.boolean(),
      interval: z.number().int().positive(),
    })
    .optional(),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

export type ShopSettings = z.infer<typeof shopSettingsSchema>;

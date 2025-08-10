import { z } from "zod";
import { localeSchema } from "./Product";
import { shopSeoFieldsSchema } from "./Shop";

export const shopSettingsSchema = z.object({
  languages: z.array(localeSchema).readonly(),
  seo: z.record(localeSchema, shopSeoFieldsSchema),
  analytics: z
    .object({
      enabled: z.boolean().optional(),
      provider: z.string(),
      id: z.string().optional(),
    })
    .optional(),
  freezeTranslations: z.boolean().optional(),
  updatedAt: z.string(),
  updatedBy: z.string(),
});

export type ShopSettings = z.infer<typeof shopSettingsSchema>;

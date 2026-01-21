import { z } from "zod";

import { localeSchema } from "./Product";

export const shopLocaleSchema = z
  .object({
    priceOverrides: z
      .record(localeSchema, z.number().int().nonnegative())
      .default({}),
    localeOverrides: z.record(z.string(), localeSchema).default({}),
    homeTitle: z.record(localeSchema, z.string()).optional(),
    homeDescription: z.record(localeSchema, z.string()).optional(),
  })
  .strict();

export type ShopLocale = z.infer<typeof shopLocaleSchema>;

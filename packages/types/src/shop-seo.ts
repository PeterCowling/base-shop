import { z } from "zod";

export const shopSeoFieldsSchema = z
  .object({
    canonicalBase: z.string().url().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    alt: z.string().optional(),
    openGraph: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().url().optional(),
        image: z.string().url().optional(),
      })
      .strict()
      .optional(),
    twitter: z
      .object({
        card: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.string().url().optional(),
        // LAUNCH-23: Added to support createShop SeoConfig
        site: z.string().optional(),
        creator: z.string().optional(),
      })
      .strict()
      .optional(),
    structuredData: z.string().optional(),
  })
  .strict();

export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;

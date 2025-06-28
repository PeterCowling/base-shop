import { z } from "zod";

export const shopSeoFieldsSchema = z.object({
  canonicalBase: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
});

export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;

export const shopSchema = z.object({
  id: z.string(),
  name: z.string(),
  catalogFilters: z.array(z.string()),
  themeId: z.string(),
  /** Mapping of design tokens to theme values */
  themeTokens: z.record(z.string()),
  /** Mapping of logical filter keys to catalog attributes */
  filterMappings: z.record(z.string()),
});

export type Shop = z.infer<typeof shopSchema>;

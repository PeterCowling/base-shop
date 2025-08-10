import { z } from "zod";
import { localeSchema } from "./Product";

export const shopSeoFieldsSchema = z.object({
  canonicalBase: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  openGraph: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      url: z.string().url().optional(),
      image: z.string().url().optional(),
    })
    .optional(),
  twitter: z
    .object({
      card: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().url().optional(),
    })
    .optional(),
  structuredData: z.string().optional(),
});

export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;

export const sanityBlogConfigSchema = z.object({
  projectId: z.string(),
  dataset: z.string(),
  token: z.string(),
});

export type SanityBlogConfig = z.infer<typeof sanityBlogConfigSchema>;

export const shopDomainSchema = z.object({
  name: z.string(),
  status: z.string().optional(),
  certificateStatus: z.string().optional(),
});

export type ShopDomain = z.infer<typeof shopDomainSchema>;

export const shopSchema = z.object({
  id: z.string(),
  name: z.string(),
  logo: z.string().optional(),
  contactInfo: z.string().optional(),
  catalogFilters: z.array(z.string()),
  themeId: z.string(),
  /** Mapping of design tokens to theme values */
  themeTokens: z.record(z.string()),
  /** Mapping of logical filter keys to catalog attributes */
  filterMappings: z.record(z.string()),
  /** Optional price overrides per locale (minor units) */
  priceOverrides: z
    .record(localeSchema, z.number().int().nonnegative())
    .default({}),
  /** Optional redirect overrides for locale detection */
  localeOverrides: z.record(z.string(), localeSchema).default({}),
  type: z.string().optional(),
  paymentProviders: z.array(z.string()).optional(),
  shippingProviders: z.array(z.string()).optional(),
  taxProviders: z.array(z.string()).optional(),
  homeTitle: z.record(localeSchema, z.string()).optional(),
  homeDescription: z.record(localeSchema, z.string()).optional(),
  homeImage: z.string().optional(),
  navigation: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
  sanityBlog: sanityBlogConfigSchema.optional(),
  domain: shopDomainSchema.optional(),
  analyticsEnabled: z.boolean().optional(),
});

export type Shop = z.infer<typeof shopSchema>;

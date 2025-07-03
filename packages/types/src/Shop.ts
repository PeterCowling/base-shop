import { z } from "zod";
import { localeSchema, type Locale, type Translated } from "./Product";

export const shopSeoFieldsSchema = z.object({
  canonicalBase: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  openGraph: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      url: z.string().optional(),
      image: z.string().optional(),
    })
    .optional(),
  twitter: z
    .object({
      card: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      image: z.string().optional(),
    })
    .optional(),
  structuredData: z.string().optional(),
});

export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;

export interface Shop {
  id: string;
  name: string;
  catalogFilters: string[];
  themeId: string;
  /** Mapping of design tokens to theme values */
  themeTokens: Record<string, string>;
  /** Mapping of logical filter keys to catalog attributes */
  filterMappings: Record<string, string>;
  /** Optional price overrides per locale (minor units) */
  priceOverrides: Partial<Record<Locale, number>>;
  /** Optional redirect overrides for locale detection */
  localeOverrides: Record<string, Locale>;
  /** Sale or rental shop type */
  type?: string;
  /** Enabled payment provider identifiers */
  paymentProviders?: string[];
  /** Enabled shipping provider identifiers */
  shippingProviders?: string[];
  homeTitle?: Translated;
  homeDescription?: Translated;
  homeImage?: string;
  navigation?: { label: string; url: string }[];
}

export const shopSchema = z.object({
  id: z.string(),
  name: z.string(),
  catalogFilters: z.array(z.string()),
  themeId: z.string(),
  /** Mapping of design tokens to theme values */
  themeTokens: z.record(z.string()),
  /** Mapping of logical filter keys to catalog attributes */
  filterMappings: z.record(z.string()),
  /** Optional price overrides per locale (minor units) */
  priceOverrides: z.record(localeSchema, z.number()).default({}),
  /** Optional redirect overrides for locale detection */
  localeOverrides: z.record(z.string(), localeSchema).default({}),
  type: z.string().optional(),
  paymentProviders: z.array(z.string()).optional(),
  shippingProviders: z.array(z.string()).optional(),
  homeTitle: z.record(localeSchema, z.string()).optional(),
  homeDescription: z.record(localeSchema, z.string()).optional(),
  homeImage: z.string().optional(),
  navigation: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .optional(),
});

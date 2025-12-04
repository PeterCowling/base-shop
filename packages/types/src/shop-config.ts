import { z } from "zod";
import { localeSchema, pageComponentSchema, type PageComponent } from "./page";
import type { Locale } from "./constants";

export type NavItem = {
  label: string;
  url: string;
  children?: NavItem[];
};

export const navItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z
    .object({
      label: z.string(),
      url: z.string(),
      children: z.array(navItemSchema).optional(),
    })
    .strict(),
);

const localeRecordSchema = z.record(localeSchema, z.string());

const pageInfoSchema = z
  .object({
    slug: z.string(),
    title: localeRecordSchema,
    description: localeRecordSchema.optional(),
    image: localeRecordSchema.optional(),
    components: z.array(pageComponentSchema),
  })
  .strict();

export type PageInfo = {
  slug: string;
  title: Record<Locale, string>;
  description?: Record<Locale, string>;
  image?: Record<Locale, string>;
  components: PageComponent[];
};

export const shopConfigSchema = z
  .object({
    name: z.string().optional(),
    logo: z
      .union([z.string().url(), z.record(z.string(), z.string().url())])
      .optional(),
    contactInfo: z.string().optional(),
    type: z.enum(["sale", "rental"]).optional(),
    theme: z.string().optional(),
    themeOverrides: z.record(z.string()).optional(),
    template: z.string().optional(),
    payment: z.array(z.string()).optional(),
    billingProvider: z.string().optional(),
    shipping: z.array(z.string()).optional(),
    pageTitle: localeRecordSchema.optional(),
    pageDescription: localeRecordSchema.optional(),
    socialImage: z.string().url().optional(),
    analytics: z
      .object({
        enabled: z.boolean().optional(),
        provider: z.string(),
        id: z.string().optional(),
      })
      .optional(),
    navItems: z.array(navItemSchema).optional(),
    pages: z.array(pageInfoSchema).optional(),
    checkoutPage: z.array(pageComponentSchema).optional(),
    /**
     * Optional runtime application identifier for this shop.
     */
    runtimeAppId: z.string().optional(),
  })
  .strict();

export type ShopConfig = z.infer<typeof shopConfigSchema>;

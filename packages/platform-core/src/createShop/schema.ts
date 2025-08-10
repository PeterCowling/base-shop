import type { PageComponent } from "@types";
import { localeSchema, sanityBlogConfigSchema } from "@types";
import { pageComponentSchema } from "@types/Page";
import { z } from "zod";
import { slugify } from "@shared-utils";
import { fillLocales } from "@i18n/fillLocales";
import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";
import { defaultTaxProviders } from "./defaultTaxProviders";

export const createShopOptionsSchema = z
  .object({
    name: z.string().optional(),
    logo: z.string().url().optional(),
    contactInfo: z.string().optional(),
    type: z.enum(["sale", "rental"]).optional(),
    theme: z.string().optional(),
    template: z.string().optional(),
    payment: z.array(z.enum(defaultPaymentProviders)).default([]),
    shipping: z.array(z.enum(defaultShippingProviders)).default([]),
    tax: z.enum(defaultTaxProviders).default("taxjar"),
    pageTitle: z.record(localeSchema, z.string()).optional(),
    pageDescription: z.record(localeSchema, z.string()).optional(),
    socialImage: z.string().url().optional(),
    analytics: z
      .object({
        enabled: z.boolean().optional(),
        provider: z.string(),
        id: z.string().optional(),
      })
      .optional(),
    sanityBlog: sanityBlogConfigSchema.optional(),
    navItems: z
      .array(z.object({ label: z.string().min(1), url: z.string().min(1) }))
      .default([]),
    pages: z
      .array(
        z.object({
          slug: z.string(),
          title: z.record(localeSchema, z.string()),
          description: z.record(localeSchema, z.string()).optional(),
          image: z.record(localeSchema, z.string()).optional(),
          components: z.array(pageComponentSchema),
        })
      )
      .default([]),
    checkoutPage: z.array(pageComponentSchema).default([]),
  })
  .strict();

export type CreateShopOptions = z.infer<typeof createShopOptionsSchema>;

export type PreparedCreateShopOptions = Required<
  Omit<CreateShopOptions, "analytics" | "checkoutPage" | "sanityBlog">
> & {
  analytics?: CreateShopOptions["analytics"];
  sanityBlog?: CreateShopOptions["sanityBlog"];
  checkoutPage: PageComponent[];
};

/** Parse and populate option defaults. */
export function prepareOptions(
  id: string,
  opts: CreateShopOptions
): PreparedCreateShopOptions {
  const parsed = createShopOptionsSchema.parse(opts);
  return {
    name: parsed.name ?? id,
    logo: parsed.logo ?? "",
    contactInfo: parsed.contactInfo ?? "",
    type: parsed.type ?? "sale",
    theme: parsed.theme ?? "base",
    template: parsed.template ?? "template-app",
    payment: parsed.payment,
    shipping: parsed.shipping,
    tax: parsed.tax,
    pageTitle: fillLocales(parsed.pageTitle, "Home"),
    pageDescription: fillLocales(parsed.pageDescription, ""),
    socialImage: parsed.socialImage ?? "",
  analytics: parsed.analytics
      ? {
          enabled: parsed.analytics.enabled !== false,
          provider: parsed.analytics.provider ?? "none",
          id: parsed.analytics.id,
        }
      : { enabled: false, provider: "none" },
    navItems:
      parsed.navItems?.map((n) => ({
        label: n.label ?? "—",
        url: n.url ?? "#",
      })) ?? [],
    pages: parsed.pages.map((p) => ({
      slug: p.slug ?? slugify(p.title.en ?? Object.values(p.title)[0]),
      title: p.title,
      description: p.description,
      image: p.image,
      components: p.components ?? [],
    })),
    checkoutPage: parsed.checkoutPage,
    sanityBlog: parsed.sanityBlog,
  };
}

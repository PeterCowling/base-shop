import type { Locale, PageComponent } from "@types";
import { localeSchema } from "@types";
import { pageComponentSchema } from "@types/Page";
import { z } from "zod";
import { slugify } from "@shared-utils";
import { fillLocales } from "../utils/locales";
import { defaultPaymentProviders, type DefaultPaymentProvider } from "./defaultPaymentProviders";
import { defaultShippingProviders, type DefaultShippingProvider } from "./defaultShippingProviders";
import { defaultTaxProviders, type DefaultTaxProvider } from "./defaultTaxProviders";

export const createShopOptionsSchema = z.object({
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
      provider: z.string(),
      id: z.string().optional(),
    })
    .optional(),
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
});

export interface CreateShopOptions {
  name?: string;
  logo?: string;
  contactInfo?: string;
  type?: "sale" | "rental";
  theme?: string;
  template?: string;
  payment?: DefaultPaymentProvider[];
  shipping?: DefaultShippingProvider[];
  tax?: DefaultTaxProvider;
  pageTitle?: Partial<Record<Locale, string>>;
  pageDescription?: Partial<Record<Locale, string>>;
  socialImage?: string;
  analytics?: {
    provider: string;
    id?: string;
  };
  navItems?: { label: string; url: string }[];
  pages?: {
    slug: string;
    title: Partial<Record<Locale, string>>;
    description?: Partial<Record<Locale, string>>;
    image?: Partial<Record<Locale, string>>;
    components: PageComponent[];
  }[];
  checkoutPage?: PageComponent[];
}

export interface PreparedCreateShopOptions extends Required<
  Omit<CreateShopOptions, "analytics" | "checkoutPage">
> {
  analytics?: CreateShopOptions["analytics"];
  checkoutPage: PageComponent[];
}

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
      ? { provider: parsed.analytics.provider ?? "none", id: parsed.analytics.id }
      : { provider: "none" },
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
  };
}

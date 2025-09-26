import type { PageComponent } from "@acme/types";
import { localeSchema, sanityBlogConfigSchema } from "@acme/types";
import { upgradeComponentSchema as pageComponentSchema } from "@acme/types";
import { z } from "zod";
import { slugify } from "@acme/shared-utils";
import { fillLocales } from "@acme/i18n";
import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";
import { defaultTaxProviders } from "./defaultTaxProviders";

export interface NavItem {
  label: string;
  url: string;
  children?: NavItem[];
}

const navItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z
    .object({
      label: z.string().min(1),
      url: z.string().min(1),
      children: z.array(navItemSchema).optional(),
    })
    .strict()
);

export const createShopOptionsSchema = z
  .object({
    name: z.string().optional(),
    logo: z
      .union([z.string().url(), z.record(z.string(), z.string().url())])
      .optional(),
    contactInfo: z.string().optional(),
    type: z.enum(["sale", "rental"]).optional(),
    theme: z.string().optional(),
    themeOverrides: z.record(z.string()).default({}),
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
    enableEditorial: z.boolean().optional(),
    enableSubscriptions: z.boolean().optional(),
    navItems: z.array(navItemSchema).default([]),
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

export type PreparedAnalyticsOptions = {
  enabled: boolean;
  provider: string;
  id?: string;
};

export type PreparedCreateShopOptions = Required<
  Omit<
    CreateShopOptions,
    "analytics" | "checkoutPage" | "sanityBlog" | "enableEditorial" | "enableSubscriptions"
  >
> & {
  analytics: PreparedAnalyticsOptions;
  sanityBlog?: CreateShopOptions["sanityBlog"];
  enableEditorial: boolean;
  enableSubscriptions: boolean;
  checkoutPage: PageComponent[];
};

function prepareNavItems(items: NavItem[]): NavItem[] {
  return items.map((n) => ({
    label: n.label ?? "—",
    url: n.url ?? "#",
    ...(n.children && n.children.length
      ? { children: prepareNavItems(n.children) }
      : {}),
  }));
}

/** Parse and populate option defaults. */
export function prepareOptions(
  id: string,
  opts: CreateShopOptions,
): PreparedCreateShopOptions {
  const parsed: z.infer<typeof createShopOptionsSchema> =
    createShopOptionsSchema.parse(opts);
  return {
    name: parsed.name ?? id,
    logo:
      typeof parsed.logo === "string"
        ? { "desktop-landscape": parsed.logo }
        : parsed.logo ?? {},
    contactInfo: parsed.contactInfo ?? "",
    type: parsed.type ?? "sale",
    theme: parsed.theme ?? "base",
    template: parsed.template ?? "template-app",
    themeOverrides: parsed.themeOverrides ?? {},
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
    navItems: prepareNavItems(parsed.navItems ?? []),
    pages: parsed.pages.map((p) => ({
      slug: p.slug ?? slugify(p.title.en ?? Object.values(p.title)[0]),
      title: p.title,
      description: p.description,
      image: p.image,
      components: p.components ?? [],
    })),
    checkoutPage: parsed.checkoutPage as unknown as PageComponent[],
    sanityBlog: parsed.sanityBlog,
    enableEditorial: parsed.enableEditorial ?? false,
    enableSubscriptions: parsed.enableSubscriptions ?? false,
  };
}

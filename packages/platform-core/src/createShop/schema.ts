import { z } from "zod";

import { fillLocales } from "@acme/i18n";
import { slugify } from "@acme/lib/string";
import type { PageComponent } from "@acme/types";
import { localeSchema, sanityBlogConfigSchema , upgradeComponentSchema as pageComponentSchema } from "@acme/types";

import { shopAccountConfigSchema } from "./accountRegistry";
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

// SEO schema for brand kit / shop-level SEO (LAUNCH-23)
const seoConfigSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    canonicalBase: z.string().url().optional(),
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
        card: z.enum(["summary", "summary_large_image"]).optional(),
        site: z.string().optional(),
        creator: z.string().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type SeoConfig = z.infer<typeof seoConfigSchema>;

// Page config schema with template provenance (LAUNCH-23)
const pageConfigSchema = z.object({
  slug: z.string(),
  title: z.record(localeSchema, z.string()),
  description: z.record(localeSchema, z.string()).optional(),
  image: z.record(localeSchema, z.string()).optional(),
  components: z.array(pageComponentSchema),
  // Template provenance fields
  templateId: z.string().optional(),
  templateVersion: z.string().optional(),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  visibility: z.enum(["public", "hidden"]).optional().default("public"),
});

export type PageConfig = z.infer<typeof pageConfigSchema>;

// Required pages for Basic tier launches (LAUNCH-23)
export const REQUIRED_PAGES_BASIC = [
  "home",
  "shop", // category/PLP
  "about",
  "contact",
  "faq", // FAQ/size guide
  "shipping-returns",
] as const;

// Required legal pages for compliance (LAUNCH-27)
export const REQUIRED_LEGAL_PAGES = [
  "terms", // Terms of service
  "privacy", // Privacy policy
  "returns", // Returns/refund policy (can overlap with shipping-returns)
] as const;

// Optional legal pages (recommended but not blocking launch)
export const OPTIONAL_LEGAL_PAGES = [
  "cookie", // Cookie policy
  "vat", // VAT/tax information
  "accessibility", // Accessibility statement
] as const;

export type RequiredLegalPageSlug = (typeof REQUIRED_LEGAL_PAGES)[number];
export type OptionalLegalPageSlug = (typeof OPTIONAL_LEGAL_PAGES)[number];

export type RequiredPageSlug = (typeof REQUIRED_PAGES_BASIC)[number];

export const createShopOptionsSchema = z
  .object({
    name: z.string().optional(),
    logo: z
      .union([z.string().url(), z.record(z.string(), z.string().url())])
      .optional(),
    contactInfo: z.string().optional(),
    type: z.enum(["sale", "rental"]).optional(),
    // Theme fields (LAUNCH-23: add themeDefaults and themeTokens)
    theme: z.string().optional(),
    themeDefaults: z.record(z.string()).optional(),
    themeOverrides: z.record(z.string()).default({}),
    themeTokens: z.record(z.string()).optional(),
    template: z.string().optional(),
    payment: z.array(z.enum(defaultPaymentProviders)).default([]),
    billingProvider: z.enum(defaultPaymentProviders).optional(),
    shipping: z.array(z.enum(defaultShippingProviders)).default([]),
    tax: z.enum(defaultTaxProviders).default("taxjar"),
    // Legacy SEO fields (kept for backwards compat)
    pageTitle: z.record(localeSchema, z.string()).optional(),
    pageDescription: z.record(localeSchema, z.string()).optional(),
    socialImage: z.string().url().optional(),
    // Brand kit / SEO (LAUNCH-23)
    favicon: z.string().url().optional(),
    seo: seoConfigSchema.optional(),
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
    // Pages with template provenance (LAUNCH-23)
    pages: z.array(pageConfigSchema).default([]),
    // Required pages mapping for Basic tier (LAUNCH-23)
    // Maps required page slugs to template IDs
    requiredPages: z
      .record(z.enum(REQUIRED_PAGES_BASIC), z.string())
      .optional(),
    checkoutPage: z.array(pageComponentSchema).default([]),
  })
  .strict();

export type CreateShopOptions = z.infer<typeof createShopOptionsSchema>;

// Launch config schema for pnpm launch-shop orchestrator
const deployTargetSchema = z
  .object({
    type: z.enum(["cloudflare-pages", "vercel", "local"]),
    projectName: z.string().min(1).max(63).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type !== "local" && !value.projectName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "deployTarget.projectName is required for non-local deploy targets",
      });
    }
  });

const ciConfigSchema = z
  .object({
    workflowName: z.string().min(1).optional(),
    useReusableWorkflow: z.boolean().optional(),
  })
  .strict();

const smokeCheckSchema = z
  .object({
    endpoint: z.string().min(1),
    expectedStatus: z.number().int().optional().default(200),
  })
  .strict();

// Compliance sign-off schema (LAUNCH-27)
const complianceSignOffSchema = z
  .object({
    // Owner confirms compliance with legal requirements
    signedOffBy: z.string().min(1).describe("Email or name of person who signed off"),
    signedOffAt: z.string().datetime().describe("ISO 8601 signed-off value"),
    // Optional: specific acknowledgments
    acknowledgments: z
      .object({
        termsReviewed: z.boolean().optional(),
        privacyReviewed: z.boolean().optional(),
        vatCompliant: z.boolean().optional(),
        gdprCompliant: z.boolean().optional(),
      })
      .strict()
      .optional(),
    // Director approval for templates (required for Basic tier)
    directorApprovedTemplates: z.boolean().optional(),
  })
  .strict();

export type ComplianceSignOff = z.infer<typeof complianceSignOffSchema>;

export const launchConfigSchema = createShopOptionsSchema
  .extend({
    schemaVersion: z.number().int().min(1),
    shopId: z.string().min(1).regex(/^[a-z0-9_-]+$/i),
    deployTarget: deployTargetSchema,
    ci: ciConfigSchema.optional(),
    smokeChecks: z.array(smokeCheckSchema).optional(),
    environments: z.record(z.string(), z.record(z.unknown())).optional(),
    // Compliance sign-off (LAUNCH-27) - required for production launches
    complianceSignOff: complianceSignOffSchema.optional(),
    // Legal pages mapping (LAUNCH-27) - maps legal page slugs to template IDs
    legalPages: z
      .record(z.string(), z.string())
      .optional()
      .describe("Maps legal page slugs (terms, privacy, etc.) to template IDs"),
    // Provider accounts configuration (LAUNCH-28)
    providerAccounts: shopAccountConfigSchema
      .optional()
      .describe("Payment, shipping, and tax provider account configuration"),
    // Provider template overrides (LAUNCH-28) - for custom provider selection
    providerTemplates: z
      .object({
        payment: z.string().optional().describe("Payment provider template ID"),
        shipping: z.string().optional().describe("Shipping provider template ID"),
        tax: z.string().optional().describe("Tax provider template ID"),
      })
      .strict()
      .optional()
      .describe("Override default provider templates"),
  })
  .strict();

export type LaunchConfig = z.infer<typeof launchConfigSchema>;

export type PreparedAnalyticsOptions = {
  enabled: boolean;
  provider: string;
  id?: string;
};

export type PreparedCreateShopOptions = Required<
  Omit<
    CreateShopOptions,
    | "analytics"
    | "checkoutPage"
    | "sanityBlog"
    | "enableEditorial"
    | "enableSubscriptions"
    // LAUNCH-23: Optional fields with defaults
    | "themeDefaults"
    | "themeTokens"
    | "favicon"
    | "seo"
    | "requiredPages"
  >
> & {
  analytics: PreparedAnalyticsOptions;
  sanityBlog?: CreateShopOptions["sanityBlog"];
  enableEditorial: boolean;
  enableSubscriptions: boolean;
  checkoutPage: PageComponent[];
  // LAUNCH-23: New optional fields
  themeDefaults?: Record<string, string>;
  themeTokens?: Record<string, string>;
  favicon?: string;
  seo?: SeoConfig;
  requiredPages?: Partial<Record<RequiredPageSlug, string>>;
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
  opts: Partial<CreateShopOptions>,
): PreparedCreateShopOptions {
  const parsed: z.infer<typeof createShopOptionsSchema> =
    createShopOptionsSchema.parse(opts);
  const payments = Array.isArray(parsed.payment) ? parsed.payment : [];
  const billingProvider =
    parsed.billingProvider ??
    (payments.includes("stripe")
      ? "stripe"
      : payments[0] ?? "");
  const shipping = Array.isArray(parsed.shipping) ? parsed.shipping : [];
  const tax = parsed.tax ?? "taxjar";
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
    // LAUNCH-23: Theme defaults and tokens
    themeDefaults: parsed.themeDefaults,
    themeTokens: parsed.themeTokens,
    payment: payments,
    billingProvider,
    shipping,
    tax,
    pageTitle: fillLocales(parsed.pageTitle, "Home"),
    pageDescription: fillLocales(parsed.pageDescription, ""),
    socialImage: parsed.socialImage ?? "",
    // LAUNCH-23: Brand kit fields
    favicon: parsed.favicon,
    seo: parsed.seo,
    analytics: parsed.analytics
      ? {
          enabled: parsed.analytics.enabled !== false,
          provider: parsed.analytics.provider ?? "none",
          id: parsed.analytics.id,
        }
      : { enabled: false, provider: "none" },
    navItems: prepareNavItems(parsed.navItems ?? []),
    // LAUNCH-23: Include template provenance and status fields
    pages: parsed.pages.map((p) => ({
      slug: p.slug ?? slugify(p.title.en ?? Object.values(p.title)[0]),
      title: p.title,
      description: p.description,
      image: p.image,
      components: p.components ?? [],
      templateId: p.templateId,
      templateVersion: p.templateVersion,
      status: p.status ?? "draft",
      visibility: p.visibility ?? "public",
    })),
    // LAUNCH-23: Required pages mapping
    requiredPages: parsed.requiredPages,
    checkoutPage: parsed.checkoutPage as unknown as PageComponent[],
    sanityBlog: parsed.sanityBlog,
    enableEditorial: parsed.enableEditorial ?? false,
    enableSubscriptions: parsed.enableSubscriptions ?? false,
  };
}

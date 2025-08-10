// apps/cms/src/app/cms/wizard/schema.ts
import { LOCALES } from "@acme/i18n";
import { fillLocales } from "@platform-core/utils";
import { pageComponentSchema } from "@types/Page";
import { localeSchema, type Locale } from "@types";
import { ulid } from "ulid";
import { z } from "zod";
import { baseTokens } from "./tokenUtils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Builds a `Record<Locale,string>` with a default value for the first locale. */
function defaultLocaleRecord(
  first: string | null = null
): Record<Locale, string> {
  const record = fillLocales(undefined, "");
  if (first !== null) {
    record[LOCALES[0]] = first;
  }
  return record;
}

const localeRecordSchema = z.record(localeSchema, z.string());

/* -------------------------------------------------------------------------- */
/*  Nav‑item schema (recursive)                                               */
/* -------------------------------------------------------------------------- */

export interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

export const navItemSchema: z.ZodType<NavItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    url: z.string().url(),
    children: z.array(navItemSchema).optional(),
  })
);

/* -------------------------------------------------------------------------- */
/*  Page‑info schema                                                          */
/* -------------------------------------------------------------------------- */

export const pageInfoSchema = z
  .object({
    id: z.string().optional(),
    /** `slug` is **required** so routing can never break. */
    slug: z.string(),
    /** All locale keys are required – no `Partial`. */
    title: localeRecordSchema,
    description: localeRecordSchema,
    image: localeRecordSchema,
    /** Components are serialised PageComponent instances. */
    components: z.array(pageComponentSchema).default([]),
  })
  .strict();

export type PageInfo = z.infer<typeof pageInfoSchema>; // <- slug & components **required**

/* -------------------------------------------------------------------------- */
/*  Wizard‑state schema                                                       */
/* -------------------------------------------------------------------------- */

export const wizardStateSchema = z.object({
  /* ------------ Wizard progress & identity ------------ */
  step: z.number().optional().default(0),
  shopId: z.string().optional().default(""),
  storeName: z.string().optional().default(""),
  logo: z.string().optional().default(""),
  contactInfo: z.string().optional().default(""),

  /* ---------------- Template / theme ------------------ */
  template: z.string().optional().default(""),
  theme: z.string().optional().default(""),
  themeVars: z.record(z.string()).optional().default(baseTokens),

  /* -------------- Commerce settings ------------------- */
  payment: z.array(z.string()).default([]),
  shipping: z.array(z.string()).default([]),

  /* ------------------- SEO fields --------------------- */
  pageTitle: localeRecordSchema
    .optional()
    .default(() => defaultLocaleRecord("Home")),
  pageDescription: localeRecordSchema
    .optional()
    .default(() => defaultLocaleRecord("")),
  socialImage: z.string().optional().default(""),

  /* ------------- Global component pools --------------- */
  components: z.array(pageComponentSchema).default([]),

  headerComponents: z.array(pageComponentSchema).default([]),
  headerPageId: z.string().nullable().optional().default(null),

  footerComponents: z.array(pageComponentSchema).default([]),
  footerPageId: z.string().nullable().optional().default(null),

  homePageId: z.string().nullable().optional().default(null),
  homeLayout: z.string().optional().default(""),

  shopComponents: z.array(pageComponentSchema).default([]),
  shopPageId: z.string().nullable().optional().default(null),
  shopLayout: z.string().optional().default(""),

  productComponents: z.array(pageComponentSchema).default([]),
  productPageId: z.string().nullable().optional().default(null),
  productLayout: z.string().optional().default(""),

  checkoutComponents: z.array(pageComponentSchema).default([]),
  checkoutPageId: z.string().nullable().optional().default(null),
  checkoutLayout: z.string().optional().default(""),

  /* ------------------- Analytics ---------------------- */
  analyticsProvider: z.string().optional().default(""),
  analyticsId: z.string().optional().default(""),

  /* ------------------- Navigation --------------------- */
  navItems: z
    .array(navItemSchema)
    .default(() => [{ id: ulid(), label: "Shop", url: "https://example.com/shop" }]),

  /* ------------------- Dynamic pages ------------------ */
  pages: z.array(pageInfoSchema).default([]),

  /* ---------------- Miscellaneous --------------------- */
  domain: z.string().optional().default(""),
  categoriesText: z.string().optional().default(""),
}).strict();

export type WizardState = z.infer<typeof wizardStateSchema>;

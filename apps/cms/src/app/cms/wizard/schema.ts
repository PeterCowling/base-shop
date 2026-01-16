// apps/cms/src/app/cms/wizard/schema.ts
import { LOCALES } from "@acme/i18n";
import { fillLocales } from "@i18n/fillLocales";
import {
  pageComponentSchema,
  localeSchema,
  type Locale,
  type PageComponent,
} from "@acme/types";
import {
  environmentSettingsSchema,
  providerSettingsSchema,
  themeSettingsSchema,
} from "@acme/types/settings";
import { ulid } from "ulid";
import { z, type ZodType } from "zod";
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
// For places where all locales must be present (no Partial)
const requiredLocaleRecordSchema: z.ZodType<Record<Locale, string>> = z
  .object(
    Object.fromEntries(LOCALES.map((l) => [l, z.string()])) as Record<
      Locale,
      z.ZodString
    >
  ) as unknown as z.ZodType<Record<Locale, string>>;

/* -------------------------------------------------------------------------- */
/*  Nav‑item schema (recursive)                                               */
/* -------------------------------------------------------------------------- */

/** Recursively defined navigation item used in the wizard. */
type NavItemInternal = {
  id: string;
  label: string;
  url: string;
  children?: NavItemInternal[];
};

const navItemSchemaInner = z
  .object({
    id: z.string(),
    label: z.string(),
    url: z.string().url(),
    children: z.array(z.lazy(() => navItemSchema)).optional(),
  })
  .strict() as unknown as ZodType<NavItemInternal>;

export const navItemSchema = z.lazy(() => navItemSchemaInner) as ZodType<NavItemInternal>;

export type NavItem = z.infer<typeof navItemSchema>;

/* -------------------------------------------------------------------------- */
/*  Page‑info schema                                                          */
/* -------------------------------------------------------------------------- */

export interface PageInfo {
  id?: string;
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  image: Record<Locale, string>;
  components: PageComponent[];
}

export const pageInfoSchema = z
  .object({
    id: z.string().optional(),
    /** `slug` is **required** so routing can never break. */
    slug: z.string(),
    /** All locale keys are required – no `Partial`. */
    title: requiredLocaleRecordSchema,
    description: requiredLocaleRecordSchema,
    image: requiredLocaleRecordSchema,
    /** Components are serialised PageComponent instances. */
    components: z.array(pageComponentSchema).default([]),
  })
  .strict() as z.ZodSchema<PageInfo>;
// slug & components are required (components defaults to [])

/* -------------------------------------------------------------------------- */
/*  Wizard‑state schema                                                       */
/* -------------------------------------------------------------------------- */

export const stepStatusSchema = z.enum(["pending", "complete", "skipped"]);
export type StepStatus = z.infer<typeof stepStatusSchema>;

const configuratorStateSchemaBase: z.AnyZodObject = z
  .object({
    /* ------------ Wizard progress & identity ------------ */
    shopId: z.string().optional().default(""),
    storeName: z.string().optional().default(""),
    logo: z
      .union([z.string(), z.record(z.string(), z.string())])
      .optional()
      .default({})
      .transform((val) =>
        typeof val === "string" && val
          ? { "desktop-landscape": val }
          : (val as Record<string, string>)
      ),
    contactInfo: z.string().optional().default(""),
    type: z.enum(["sale", "rental"]).optional().default("sale"),
    completed: z.record(stepStatusSchema).optional().default({}),
    billingProvider: z.string().optional().default(""),

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

    /* ------------------- Inventory ---------------------- */
    inventoryTracking: z.boolean().optional().default(true),
    lowStockThreshold: z.number().int().min(0).optional().default(5),
    backorderPolicy: z.enum(["deny", "notify", "allow"]).optional().default("deny"),
    defaultStockLocation: z.string().optional().default("main"),

    /* ------------------- Navigation --------------------- */
    navItems: z
      .array(navItemSchema)
      .default(() => [{ id: ulid(), label: "Shop", url: "https://example.com/shop" }]),

    /* ------------------- Dynamic pages ------------------ */
    pages: z.array(pageInfoSchema).default([]),

    /* ---------------- Miscellaneous --------------------- */
    domain: z.string().optional().default(""),
    categoriesText: z.string().optional().default(""),
  })
  .merge(
    themeSettingsSchema.extend({
      themeDefaults: z.record(z.string()).optional().default(baseTokens),
    })
  )
  .merge(providerSettingsSchema)
  .extend({
    env: environmentSettingsSchema.optional().default({}),
  })
  .strict();

export type ConfiguratorState = z.infer<typeof configuratorStateSchemaBase>;
export const configuratorStateSchema: z.AnyZodObject = configuratorStateSchemaBase;

// Backwards compatibility exports
export type WizardState = ConfiguratorState;
export const wizardStateSchema = configuratorStateSchema;

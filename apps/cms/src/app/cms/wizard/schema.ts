// apps/cms/src/app/cms/wizard/schema.ts
import { LOCALES } from "@acme/i18n";
import { fillLocales } from "@i18n/fillLocales";
import {
  pageComponentSchema,
  localeSchema,
  type Locale,
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

export const navItemSchema: ZodType<NavItemInternal> = z.lazy(
  (): ZodType<NavItemInternal> =>
    z
      .object({
        id: z.string(),
        label: z.string(),
        url: z.string().url(),
        children: z.array(navItemSchema).optional(),
      })
      .strict(),
);

export type NavItem = z.infer<typeof navItemSchema>;

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

export const stepStatusSchema = z.enum(["pending", "complete", "skipped"]);
export type StepStatus = z.infer<typeof stepStatusSchema>;

const wizardStateSchemaBase: z.AnyZodObject = z
  .object({
    /* ------------ Wizard progress & identity ------------ */
    shopId: z.string().optional().default(""),
    storeName: z.string().optional().default(""),
    logo: z.string().optional().default(""),
    contactInfo: z.string().optional().default(""),
    type: z.enum(["sale", "rental"]).optional().default("sale"),
    completed: z.record(stepStatusSchema).optional().default({}),

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

export type WizardState = z.infer<typeof wizardStateSchemaBase>;
export const wizardStateSchema: z.AnyZodObject = wizardStateSchemaBase;

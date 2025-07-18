// apps/cms/src/app/cms/wizard/schema.ts
/* eslint‑disable @typescript-eslint/consistent‑type‑assertions */
import { LOCALES } from "@acme/i18n";
import type { Locale, PageComponent } from "@types";
import { ulid } from "ulid";
import { z } from "zod";
import { baseTokens } from "./utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Builds a `Record<Locale,string>` with a default value for the first locale. */
function defaultLocaleRecord(
  first: string | null = null
): Record<Locale, string> {
  return LOCALES.reduce<Record<Locale, string>>(
    (acc, l, i) => {
      acc[l] = i === 0 && first !== null ? first : "";
      return acc;
    },
    {} as Record<Locale, string>
  );
}

/**
 * Strongly typed record where **every** locale key is required.
 * We cast once to satisfy the compiler; both input and output types are identical.
 */
const localeRecordSchema = z
  .object(
    LOCALES.reduce(
      (acc, l) => ({ ...acc, [l]: z.string() }),
      {} as Record<Locale, z.ZodString>
    )
  )
  .transform((x) => x as Record<Locale, string>) as unknown as z.ZodType<
  Record<Locale, string>,
  z.ZodTypeDef,
  Record<Locale, string>
>;

/* -------------------------------------------------------------------------- */
/*  Nav‑item schema (recursive)                                               */
/* -------------------------------------------------------------------------- */

export interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

const _navItemSchema: z.ZodType<NavItem> = z.lazy(
  () =>
    z.object({
      id: z.string(),
      label: z.string(),
      url: z.string(),
      children: z.array(_navItemSchema).optional(),
    }) as z.ZodType<NavItem>
);

export const navItemSchema = _navItemSchema as unknown as z.ZodType<
  NavItem,
  z.ZodTypeDef,
  NavItem
>;

/* -------------------------------------------------------------------------- */
/*  Page‑info schema                                                          */
/* -------------------------------------------------------------------------- */

export const pageInfoSchema = z.object({
  id: z.string().optional(),
  /** `slug` is **required** so routing can never break. */
  slug: z.string(),
  /** All locale keys are required – no `Partial`. */
  title: localeRecordSchema,
  description: localeRecordSchema,
  image: localeRecordSchema,
  /** Components are serialised PageComponent instances. */
  components: z.array(z.custom<PageComponent>()).default([]),
});

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
  components: z.array(z.custom<PageComponent>()).default([]),

  headerComponents: z.array(z.custom<PageComponent>()).default([]),
  headerPageId: z.string().nullable().optional().default(null),

  footerComponents: z.array(z.custom<PageComponent>()).default([]),
  footerPageId: z.string().nullable().optional().default(null),

  homePageId: z.string().nullable().optional().default(null),
  homeLayout: z.string().optional().default(""),

  shopComponents: z.array(z.custom<PageComponent>()).default([]),
  shopPageId: z.string().nullable().optional().default(null),
  shopLayout: z.string().optional().default(""),

  productComponents: z.array(z.custom<PageComponent>()).default([]),
  productPageId: z.string().nullable().optional().default(null),
  productLayout: z.string().optional().default(""),

  checkoutComponents: z.array(z.custom<PageComponent>()).default([]),
  checkoutPageId: z.string().nullable().optional().default(null),
  checkoutLayout: z.string().optional().default(""),

  /* ------------------- Analytics ---------------------- */
  analyticsProvider: z.string().optional().default(""),
  analyticsId: z.string().optional().default(""),

  /* ------------------- Navigation --------------------- */
  navItems: z
    .array(navItemSchema)
    .default(() => [{ id: ulid(), label: "Shop", url: "/shop" }]),

  /* ------------------- Dynamic pages ------------------ */
  pages: z.array(pageInfoSchema).default([]),

  /* ---------------- Miscellaneous --------------------- */
  newPageLayout: z.string().optional().default(""),
  domain: z.string().optional().default(""),
  categoriesText: z.string().optional().default(""),
});

export type WizardState = z.infer<typeof wizardStateSchema>;

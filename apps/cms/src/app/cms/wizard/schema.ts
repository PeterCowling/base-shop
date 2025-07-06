// apps/cms/src/app/cms/wizard/schema.ts
import { LOCALES, type Locale } from "@types";
import { ulid } from "ulid";
import { z } from "zod";
import { baseTokens } from "./utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function defaultLocaleRecord(
  first: string | null = null
): Record<Locale, string> {
  const obj = {} as Record<Locale, string>;
  LOCALES.forEach((l, i) => {
    obj[l] = i === 0 && first !== null ? first : "";
  });
  return obj;
}

/* -------------------------------------------------------------------------- */
/*  Nav‑item schema (recursive)                                               */
/* -------------------------------------------------------------------------- */

export interface NavItem {
  id: string;
  label: string;
  url: string;
  children?: NavItem[];
}

/**
 * Recursive schema for {@link NavItem}.
 *
 * 1.  **No generic annotation** inside `z.lazy` – so TS never widens keys.
 * 2.  After the schema is built, we **cast once** to `z.ZodType<NavItem>`
 *     to tell the compiler the output/input type we expect.
 */
const _navItemSchema = z.lazy(() =>
  z.object({
    id: z.string(),
    label: z.string(),
    url: z.string(),
    children: z.array(_navItemSchema).optional(),
  })
);

/* The single, safe assertion */
export const navItemSchema = _navItemSchema as unknown as z.ZodType<
  NavItem,
  z.ZodTypeDef,
  NavItem
>;

/* -------------------------------------------------------------------------- */
/*  Wizard‑state schema                                                       */
/* -------------------------------------------------------------------------- */

export const wizardStateSchema = z.object({
  step: z.number().optional().default(0),
  shopId: z.string().optional().default(""),
  template: z.string().optional().default(""),
  theme: z.string().optional().default(""),
  themeVars: z.record(z.string()).optional().default(baseTokens),

  payment: z.array(z.string()).default([]),
  shipping: z.array(z.string()).default([]),

  pageTitle: z
    .record(z.string(), z.string())
    .optional()
    .default(() => defaultLocaleRecord("Home")),

  pageDescription: z
    .record(z.string(), z.string())
    .optional()
    .default(() => defaultLocaleRecord("")),

  socialImage: z.string().optional().default(""),
  storeName: z.string().optional().default(""),
  logo: z.string().optional().default(""),
  contactInfo: z.string().optional().default(""),

  components: z.array(z.any()).default([]),

  headerComponents: z.array(z.any()).default([]),
  headerPageId: z.string().nullable().optional().default(null),

  footerComponents: z.array(z.any()).default([]),
  footerPageId: z.string().nullable().optional().default(null),

  homePageId: z.string().nullable().optional().default(null),
  homeLayout: z.string().optional().default(""),

  shopComponents: z.array(z.any()).default([]),
  shopPageId: z.string().nullable().optional().default(null),
  shopLayout: z.string().optional().default(""),

  productComponents: z.array(z.any()).default([]),
  productPageId: z.string().nullable().optional().default(null),
  productLayout: z.string().optional().default(""),

  checkoutComponents: z.array(z.any()).default([]),
  checkoutPageId: z.string().nullable().optional().default(null),
  checkoutLayout: z.string().optional().default(""),

  analyticsProvider: z.string().optional().default(""),
  analyticsId: z.string().optional().default(""),

  navItems: z
    .array(navItemSchema)
    .default(() => [{ id: ulid(), label: "Shop", url: "/shop" }]),

  pages: z.array(z.any()).default([]),
  newPageLayout: z.string().optional().default(""),

  domain: z.string().optional().default(""),
  categoriesText: z.string().optional().default(""),
});

export type WizardState = z.infer<typeof wizardStateSchema>;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wizardStateSchema = exports.stepStatusSchema = exports.pageInfoSchema = exports.navItemSchema = void 0;
// apps/cms/src/app/cms/wizard/schema.ts
var i18n_1 = require("@acme/i18n");
var fillLocales_1 = require("@i18n/fillLocales");
var page_1 = require("@acme/types/page");
var types_1 = require("@acme/types");
var ulid_1 = require("ulid");
var zod_1 = require("zod");
var tokenUtils_1 = require("./tokenUtils");
/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */
/** Builds a `Record<Locale,string>` with a default value for the first locale. */
function defaultLocaleRecord(first) {
    if (first === void 0) { first = null; }
    var record = (0, fillLocales_1.fillLocales)(undefined, "");
    if (first !== null) {
        record[i18n_1.LOCALES[0]] = first;
    }
    return record;
}
var localeRecordSchema = zod_1.z.record(types_1.localeSchema, zod_1.z.string());
exports.navItemSchema = zod_1.z.lazy(function () {
    return zod_1.z
        .object({
        id: zod_1.z.string(),
        label: zod_1.z.string(),
        url: zod_1.z.string().url(),
        children: zod_1.z.array(exports.navItemSchema).optional(),
    })
        .strict();
});
/* -------------------------------------------------------------------------- */
/*  Page‑info schema                                                          */
/* -------------------------------------------------------------------------- */
exports.pageInfoSchema = zod_1.z
    .object({
    id: zod_1.z.string().optional(),
    /** `slug` is **required** so routing can never break. */
    slug: zod_1.z.string(),
    /** All locale keys are required – no `Partial`. */
    title: localeRecordSchema,
    description: localeRecordSchema,
    image: localeRecordSchema,
    /** Components are serialised PageComponent instances. */
    components: zod_1.z.array(page_1.pageComponentSchema).default([]),
})
    .strict();
/* -------------------------------------------------------------------------- */
/*  Wizard‑state schema                                                       */
/* -------------------------------------------------------------------------- */
exports.stepStatusSchema = zod_1.z.enum(["pending", "complete", "skipped"]);
exports.wizardStateSchema = zod_1.z.object({
    /* ------------ Wizard progress & identity ------------ */
    shopId: zod_1.z.string().optional().default(""),
    storeName: zod_1.z.string().optional().default(""),
    logo: zod_1.z.string().optional().default(""),
    contactInfo: zod_1.z.string().optional().default(""),
    type: zod_1.z.enum(["sale", "rental"]).optional().default("sale"),
    completed: zod_1.z.record(exports.stepStatusSchema).optional().default({}),
    /* ---------------- Template / theme ------------------ */
    template: zod_1.z.string().optional().default(""),
    theme: zod_1.z.string().optional().default(""),
    themeDefaults: zod_1.z.record(zod_1.z.string()).optional().default(tokenUtils_1.baseTokens),
    themeOverrides: zod_1.z.record(zod_1.z.string()).optional().default({}),
    /* -------------- Commerce settings ------------------- */
    payment: zod_1.z.array(zod_1.z.string()).default([]),
    shipping: zod_1.z.array(zod_1.z.string()).default([]),
    /* ------------------- SEO fields --------------------- */
    pageTitle: localeRecordSchema
        .optional()
        .default(function () { return defaultLocaleRecord("Home"); }),
    pageDescription: localeRecordSchema
        .optional()
        .default(function () { return defaultLocaleRecord(""); }),
    socialImage: zod_1.z.string().optional().default(""),
    /* ------------- Global component pools --------------- */
    components: zod_1.z.array(page_1.pageComponentSchema).default([]),
    headerComponents: zod_1.z.array(page_1.pageComponentSchema).default([]),
    headerPageId: zod_1.z.string().nullable().optional().default(null),
    footerComponents: zod_1.z.array(page_1.pageComponentSchema).default([]),
    footerPageId: zod_1.z.string().nullable().optional().default(null),
    homePageId: zod_1.z.string().nullable().optional().default(null),
    homeLayout: zod_1.z.string().optional().default(""),
    shopComponents: zod_1.z.array(page_1.pageComponentSchema).default([]),
    shopPageId: zod_1.z.string().nullable().optional().default(null),
    shopLayout: zod_1.z.string().optional().default(""),
    productComponents: zod_1.z.array(page_1.pageComponentSchema).default([]),
    productPageId: zod_1.z.string().nullable().optional().default(null),
    productLayout: zod_1.z.string().optional().default(""),
    checkoutComponents: zod_1.z.array(page_1.pageComponentSchema).default([]),
    checkoutPageId: zod_1.z.string().nullable().optional().default(null),
    checkoutLayout: zod_1.z.string().optional().default(""),
    /* ------------------- Analytics ---------------------- */
    analyticsProvider: zod_1.z.string().optional().default(""),
    analyticsId: zod_1.z.string().optional().default(""),
    /* ------------------- Navigation --------------------- */
    navItems: zod_1.z
        .array(exports.navItemSchema)
        .default(function () { return [{ id: (0, ulid_1.ulid)(), label: "Shop", url: "https://example.com/shop" }]; }),
    /* ------------------- Dynamic pages ------------------ */
    pages: zod_1.z.array(exports.pageInfoSchema).default([]),
    /* ---------------- Environment vars ------------------ */
    env: zod_1.z.record(zod_1.z.string()).optional().default({}),
    /* ---------------- Miscellaneous --------------------- */
    domain: zod_1.z.string().optional().default(""),
    categoriesText: zod_1.z.string().optional().default(""),
}).strict();

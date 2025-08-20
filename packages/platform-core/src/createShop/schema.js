import { localeSchema, sanityBlogConfigSchema } from "@acme/types";
import { upgradeComponentSchema as pageComponentSchema } from "@acme/types";
import { z } from "zod";
import { slugify } from "@acme/shared-utils";
import { fillLocales } from "@acme/i18n/fillLocales";
import { defaultPaymentProviders } from "./defaultPaymentProviders";
import { defaultShippingProviders } from "./defaultShippingProviders";
import { defaultTaxProviders } from "./defaultTaxProviders";
const navItemSchema = z.lazy(() => z
    .object({
    label: z.string().min(1),
    url: z.string().min(1),
    children: z.array(navItemSchema).optional(),
})
    .strict());
export const createShopOptionsSchema = z
    .object({
    name: z.string().optional(),
    logo: z.string().url().optional(),
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
        .array(z.object({
        slug: z.string(),
        title: z.record(localeSchema, z.string()),
        description: z.record(localeSchema, z.string()).optional(),
        image: z.record(localeSchema, z.string()).optional(),
        components: z.array(pageComponentSchema),
    }))
        .default([]),
    checkoutPage: z.array(pageComponentSchema).default([]),
})
    .strict();
function prepareNavItems(items) {
    return items.map((n) => {
        var _a, _b;
        return (Object.assign({ label: (_a = n.label) !== null && _a !== void 0 ? _a : "—", url: (_b = n.url) !== null && _b !== void 0 ? _b : "#" }, (n.children && n.children.length
            ? { children: prepareNavItems(n.children) }
            : {})));
    });
}
/** Parse and populate option defaults. */
export function prepareOptions(id, opts) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const parsed = createShopOptionsSchema.parse(opts);
    return {
        name: (_a = parsed.name) !== null && _a !== void 0 ? _a : id,
        logo: (_b = parsed.logo) !== null && _b !== void 0 ? _b : "",
        contactInfo: (_c = parsed.contactInfo) !== null && _c !== void 0 ? _c : "",
        type: (_d = parsed.type) !== null && _d !== void 0 ? _d : "sale",
        theme: (_e = parsed.theme) !== null && _e !== void 0 ? _e : "base",
        template: (_f = parsed.template) !== null && _f !== void 0 ? _f : "template-app",
        themeOverrides: (_g = parsed.themeOverrides) !== null && _g !== void 0 ? _g : {},
        payment: parsed.payment,
        shipping: parsed.shipping,
        tax: parsed.tax,
        pageTitle: fillLocales(parsed.pageTitle, "Home"),
        pageDescription: fillLocales(parsed.pageDescription, ""),
        socialImage: (_h = parsed.socialImage) !== null && _h !== void 0 ? _h : "",
        analytics: parsed.analytics
            ? {
                enabled: parsed.analytics.enabled !== false,
                provider: (_j = parsed.analytics.provider) !== null && _j !== void 0 ? _j : "none",
                id: parsed.analytics.id,
            }
            : { enabled: false, provider: "none" },
        navItems: prepareNavItems((_k = parsed.navItems) !== null && _k !== void 0 ? _k : []),
        pages: parsed.pages.map((p) => {
            var _a, _b, _c;
            return ({
                slug: (_a = p.slug) !== null && _a !== void 0 ? _a : slugify((_b = p.title.en) !== null && _b !== void 0 ? _b : Object.values(p.title)[0]),
                title: p.title,
                description: p.description,
                image: p.image,
                components: (_c = p.components) !== null && _c !== void 0 ? _c : [],
            });
        }),
        checkoutPage: parsed.checkoutPage,
        sanityBlog: parsed.sanityBlog,
        enableEditorial: (_l = parsed.enableEditorial) !== null && _l !== void 0 ? _l : false,
        enableSubscriptions: (_m = parsed.enableSubscriptions) !== null && _m !== void 0 ? _m : false,
    };
}

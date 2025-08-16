"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseShopForm = parseShopForm;
exports.parseSeoForm = parseSeoForm;
exports.parseGenerateSeoForm = parseGenerateSeoForm;
exports.parseCurrencyTaxForm = parseCurrencyTaxForm;
exports.parseDepositForm = parseDepositForm;
exports.parseUpsReturnsForm = parseUpsReturnsForm;
exports.parsePremierDeliveryForm = parsePremierDeliveryForm;
exports.parseAiCatalogForm = parseAiCatalogForm;
var zod_1 = require("zod");
var types_1 = require("@acme/types");
var schemas_1 = require("../../actions/schemas");
function parseShopForm(formData) {
    var themeDefaultsRaw = formData.get("themeDefaults");
    var themeOverridesRaw = formData.get("themeOverrides");
    var parsed = schemas_1.shopSchema.safeParse(__assign(__assign({}, Object.fromEntries(formData)), { themeDefaults: themeDefaultsRaw !== null && themeDefaultsRaw !== void 0 ? themeDefaultsRaw : "{}", themeOverrides: themeOverridesRaw !== null && themeOverridesRaw !== void 0 ? themeOverridesRaw : "{}", trackingProviders: formData.getAll("trackingProviders") }));
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}
var seoSchema = zod_1.z
    .object({
    locale: types_1.localeSchema,
    title: zod_1.z.string().min(1, "Required"),
    description: zod_1.z.string().optional().default(""),
    image: zod_1.z.string().url().optional(),
    alt: zod_1.z.string().optional(),
    canonicalBase: zod_1.z.string().url().optional(),
    ogUrl: zod_1.z.string().url().optional(),
    twitterCard: zod_1.z
        .enum(["summary", "summary_large_image", "app", "player"])
        .optional(),
})
    .strict();
function parseSeoForm(formData) {
    var parsed = seoSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}
var generateSchema = zod_1.z
    .object({
    id: zod_1.z.string().min(1),
    locale: types_1.localeSchema,
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
})
    .strict();
function parseGenerateSeoForm(formData) {
    var parsed = generateSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}
var currencyTaxSchema = zod_1.z
    .object({
    currency: zod_1.z.string().length(3, "Required"),
    taxRegion: zod_1.z.string().min(1, "Required"),
})
    .strict();
function parseCurrencyTaxForm(formData) {
    var parsed = currencyTaxSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}
var depositSchema = zod_1.z
    .object({
    enabled: zod_1.z.preprocess(function (v) { return v === "on"; }, zod_1.z.boolean()),
    intervalMinutes: zod_1.z.coerce.number().int().min(1, "Must be at least 1"),
})
    .strict();
function parseDepositForm(formData) {
    var parsed = depositSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}
var returnsSchema = zod_1.z
    .object({ enabled: zod_1.z.preprocess(function (v) { return v === "on"; }, zod_1.z.boolean()) })
    .strict();
function parseUpsReturnsForm(formData) {
    var parsed = returnsSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}
var premierDeliverySchema = zod_1.z
    .object({
    regions: zod_1.z.array(zod_1.z.string().min(1)).default([]),
    windows: zod_1.z.array(zod_1.z.string().regex(/^\d{2}-\d{2}$/)).default([]),
})
    .strict();
function parsePremierDeliveryForm(formData) {
    var data = {
        regions: formData
            .getAll("regions")
            .map(String)
            .map(function (v) { return v.trim(); })
            .filter(Boolean),
        windows: formData
            .getAll("windows")
            .map(String)
            .map(function (v) { return v.trim(); })
            .filter(Boolean),
    };
    var parsed = premierDeliverySchema.safeParse(data);
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}
var aiCatalogFormSchema = zod_1.z
    .object({
    enabled: zod_1.z.preprocess(function (v) { return v === "on"; }, zod_1.z.boolean()),
    pageSize: zod_1.z.coerce.number().int().positive(),
    fields: zod_1.z.array(types_1.aiCatalogFieldSchema),
})
    .strict();
function parseAiCatalogForm(formData) {
    var data = {
        enabled: formData.get("enabled"),
        pageSize: formData.get("pageSize"),
        fields: formData.getAll("fields"),
    };
    var parsed = aiCatalogFormSchema.safeParse(data);
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors };
    }
    return { data: parsed.data };
}

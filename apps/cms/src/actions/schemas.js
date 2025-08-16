"use strict";
// apps/cms/src/actions/schemas.ts
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopSchema = exports.productSchema = void 0;
var types_1 = require("@acme/types");
var zod_1 = require("zod");
var mediaItemSchema = zod_1.z
    .object({
    url: zod_1.z.string(),
    title: zod_1.z.string().optional(),
    altText: zod_1.z.string().optional(),
    type: zod_1.z.enum(["image", "video"]),
})
    .strict();
exports.productSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    price: zod_1.z.coerce.number().min(0, "Invalid price"),
    title: zod_1.z.record(types_1.localeSchema, zod_1.z.string().min(1)),
    description: zod_1.z.record(types_1.localeSchema, zod_1.z.string().min(1)),
    media: zod_1.z.array(mediaItemSchema).default([]),
})
    .strict();
var jsonRecord = zod_1.z
    .string()
    .optional()
    .default("{}")
    .transform(function (s, ctx) {
    try {
        return s ? JSON.parse(s) : {};
    }
    catch (_a) {
        ctx.addIssue({ code: zod_1.z.ZodIssueCode.custom, message: "Invalid JSON" });
        return {};
    }
})
    .pipe(zod_1.z.record(zod_1.z.unknown()));
exports.shopSchema = zod_1.z
    .object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1, "Required"),
    themeId: zod_1.z.string().min(1, "Required"),
    catalogFilters: zod_1.z
        .string()
        .optional()
        .default("")
        .transform(function (s) {
        return s
            .split(/,\s*/)
            .map(function (v) { return v.trim(); })
            .filter(Boolean);
    }),
    enableEditorial: zod_1.z
        .preprocess(function (v) { return v === "on"; }, zod_1.z.boolean())
        .optional()
        .default(false),
    contentMerchandising: zod_1.z
        .preprocess(function (v) { return v === "on"; }, zod_1.z.boolean())
        .optional()
        .default(false),
    raTicketing: zod_1.z
        .preprocess(function (v) { return v === "on"; }, zod_1.z.boolean())
        .optional()
        .default(false),
    fraudReview: zod_1.z
        .preprocess(function (v) { return v === "on"; }, zod_1.z.boolean())
        .optional()
        .default(false),
    strictReturnConditions: zod_1.z
        .preprocess(function (v) { return v === "on"; }, zod_1.z.boolean())
        .optional()
        .default(false),
    themeOverrides: jsonRecord,
    themeDefaults: jsonRecord,
    themeTokens: jsonRecord.optional(),
    filterMappings: jsonRecord,
    priceOverrides: jsonRecord,
    localeOverrides: jsonRecord,
    trackingProviders: zod_1.z.array(zod_1.z.string()).optional().default([]),
})
    .strict()
    .transform(function (_a) {
    var contentMerchandising = _a.contentMerchandising, raTicketing = _a.raTicketing, fraudReview = _a.fraudReview, strictReturnConditions = _a.strictReturnConditions, rest = __rest(_a, ["contentMerchandising", "raTicketing", "fraudReview", "strictReturnConditions"]);
    return (__assign(__assign({}, rest), { luxuryFeatures: {
            contentMerchandising: contentMerchandising,
            raTicketing: raTicketing,
            fraudReview: fraudReview,
            strictReturnConditions: strictReturnConditions,
        } }));
});

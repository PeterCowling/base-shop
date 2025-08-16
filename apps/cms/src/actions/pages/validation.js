"use strict";
// apps/cms/src/actions/pages/validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSchema = exports.createSchema = exports.componentsField = exports.emptyTranslated = void 0;
var i18n_1 = require("@acme/i18n");
var fillLocales_1 = require("@i18n/fillLocales");
var types_1 = require("@acme/types");
var zod_1 = require("zod");
var emptyTranslated = function () {
    return (0, fillLocales_1.fillLocales)(undefined, "");
};
exports.emptyTranslated = emptyTranslated;
exports.componentsField = zod_1.z
    .string()
    .default("[]")
    .transform(function (val, ctx) {
    try {
        return JSON.parse(val);
    }
    catch (_a) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Invalid JSON",
        });
        return [];
    }
})
    .pipe(zod_1.z.array(types_1.pageComponentSchema));
var localeFields = {};
for (var _i = 0, LOCALES_1 = i18n_1.LOCALES; _i < LOCALES_1.length; _i++) {
    var l = LOCALES_1[_i];
    localeFields["title_".concat(l)] = zod_1.z.string().optional().default("");
    localeFields["desc_".concat(l)] = zod_1.z.string().optional().default("");
}
var baseSchema = zod_1.z
    .object({
    slug: zod_1.z.string().optional().default(""), // allow empty slug on create
    status: zod_1.z.enum(["draft", "published"]).default("draft"),
    image: zod_1.z
        .string()
        .optional()
        .default("")
        .refine(function (v) { return !v || /^https?:\/\/\S+$/.test(v); }, {
        message: "Invalid image URL",
    }),
    components: exports.componentsField,
})
    .extend(localeFields);
exports.createSchema = baseSchema;
exports.updateSchema = baseSchema
    .extend({
    id: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
})
    .refine(function (data) { return data.slug.trim().length > 0; }, {
    message: "Slug required",
    path: ["slug"],
});

// apps/cms/src/actions/schemas.ts
import { LOCALES } from "@types";
import { z } from "zod";
// Dynamically build locale fields for title and description
const localeFields = {};
for (const l of LOCALES) {
    localeFields[`title_${l}`] = z.string().min(1, "Required");
    localeFields[`desc_${l}`] = z.string().optional().default("");
}
export const productSchema = z
    .object({
    id: z.string(),
    price: z.coerce.number().min(0, "Invalid price"),
})
    .extend(localeFields);
const jsonRecord = z
    .string()
    .optional()
    .default("{}")
    .transform((s, ctx) => {
    try {
        return s ? JSON.parse(s) : {};
    }
    catch {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
        return {};
    }
});
export const shopSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Required"),
    themeId: z.string().min(1, "Required"),
    catalogFilters: z
        .string()
        .optional()
        .default("")
        .transform((s) => s
        .split(/,\s*/)
        .map((v) => v.trim())
        .filter(Boolean)),
    themeTokens: jsonRecord,
    filterMappings: jsonRecord,
    priceOverrides: jsonRecord,
    localeOverrides: jsonRecord,
});

// apps/cms/src/actions/pages/validation.ts

import { LOCALES } from "@acme/i18n";
import { fillLocales } from "@acme/i18n/fillLocales";
import { pageComponentSchema, type Locale } from "@acme/types";
import { z } from "zod";

export const emptyTranslated = (): Record<Locale, string> =>
  fillLocales(undefined, "");

export const componentsField = z
  .string()
  .default("[]")
  .transform((val, ctx) => {
    try {
      return JSON.parse(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid components",
      });
      return [];
    }
  })
  .pipe(z.array(pageComponentSchema));

export type PageComponents = z.infer<typeof componentsField>;

const localeFields: z.ZodRawShape = {};
for (const l of LOCALES) {
  localeFields[`title_${l}`] = z.string().optional().default("");
  localeFields[`desc_${l}`] = z.string().optional().default("");
}

const baseSchema = z
  .object({
    slug: z.string().optional().default(""), // allow empty slug on create
    status: z.enum(["draft", "published"]).default("draft"),
    stableId: z.string().optional().default(""),
    image: z
      .string()
      .optional()
      .default("")
      .refine((v) => !v || /^https?:\/\/\S+$/.test(v), {
        message: "Invalid image URL",
      }),
    components: componentsField,
  })
  .extend(localeFields as Record<string, z.ZodTypeAny>);

export const createSchema = baseSchema.refine(
  (data) => data.status !== "published" || data.slug.trim().length > 0,
  {
    message: "Slug required to publish",
    path: ["slug"],
  },
);
export type PageCreateForm = z.infer<typeof createSchema>;

export const updateSchema = baseSchema
  .extend({
    id: z.string(),
    updatedAt: z.string(),
  })
  .refine(
    (data) => data.status !== "published" || data.slug.trim().length > 0,
    {
      message: "Slug required to publish",
      path: ["slug"],
    },
  );
export type PageUpdateForm = z.infer<typeof updateSchema>;

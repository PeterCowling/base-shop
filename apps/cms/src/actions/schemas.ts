// apps/cms/src/actions/schemas.ts

import { localeSchema } from "@acme/types";
import { z } from "zod";

const mediaItemSchema = z
  .object({
    url: z.string(),
    title: z.string().optional(),
    altText: z.string().optional(),
    type: z.enum(["image", "video"]),
  })
  .strict();

export const productSchema = z
  .object({
    id: z.string(),
    price: z.coerce.number().min(0, "Invalid price"),
    title: z.record(localeSchema, z.string().min(1)),
    description: z.record(localeSchema, z.string().min(1)),
    media: z.array(mediaItemSchema).default([]),
  })
  .strict();

const jsonRecord = z
  .string()
  .optional()
  .default("{}")
  .transform((s, ctx) => {
    try {
      return s ? JSON.parse(s) : {};
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid JSON" });
      return {};
    }
  })
  .pipe(z.record(z.unknown()));

export const shopSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1, "Required"),
    themeId: z.string().min(1, "Required"),
    catalogFilters: z
      .string()
      .optional()
      .default("")
      .transform((s) =>
        s
          .split(/,\s*/)
          .map((v) => v.trim())
          .filter(Boolean)
      ),
    themeOverrides: jsonRecord,
    themeDefaults: jsonRecord,
    themeTokens: jsonRecord.optional(),
    filterMappings: jsonRecord,
    priceOverrides: jsonRecord,
    localeOverrides: jsonRecord,
  })
  .strict();

export type ProductForm = z.infer<typeof productSchema>;
export type ShopForm = z.infer<typeof shopSchema>;

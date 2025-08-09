// apps/cms/src/actions/schemas.ts

import { localeSchema } from "@types";
import { z } from "zod";

export const productSchema = z.object({
  id: z.string(),
  price: z.coerce.number().min(0, "Invalid price"),
  title: z.record(localeSchema, z.string().min(1)),
  description: z.record(localeSchema, z.string().min(1)),
});

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
  });

export const shopSchema = z.object({
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
  themeTokens: jsonRecord,
  filterMappings: jsonRecord,
  priceOverrides: jsonRecord,
  localeOverrides: jsonRecord,
});

export type ProductForm = z.infer<typeof productSchema>;
export type ShopForm = z.infer<typeof shopSchema>;

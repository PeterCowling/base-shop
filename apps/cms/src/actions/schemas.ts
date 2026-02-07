// apps/cms/src/actions/schemas.ts

import { z } from "zod";

import { localeSchema } from "@acme/types";

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
    blog: z
      .preprocess((v) => v === "on", z.boolean())
      .optional()
      .default(false),
    contentMerchandising: z
      .preprocess((v) => v === "on", z.boolean())
      .optional()
      .default(false),
    raTicketing: z
      .preprocess((v) => v === "on", z.boolean())
      .optional()
      .default(false),
    fraudReviewThreshold: z
      .preprocess((v) => (v === "" ? 0 : Number(v)), z.number())
      .optional()
      .default(0),
    requireStrongCustomerAuth: z
      .preprocess((v) => v === "on", z.boolean())
      .optional()
      .default(false),
    strictReturnConditions: z
      .preprocess((v) => v === "on", z.boolean())
      .optional()
      .default(false),
    trackingDashboard: z
      .preprocess((v) => v === "on", z.boolean())
      .optional()
      .default(false),
    premierDelivery: z
      .preprocess((v) => v === "on", z.boolean())
      .optional()
      .default(false),
    themeOverrides: jsonRecord,
    themeDefaults: jsonRecord,
    themeTokens: jsonRecord.optional(),
    filterMappings: jsonRecord,
    priceOverrides: jsonRecord,
    localeOverrides: jsonRecord,
    trackingProviders: z.array(z.string()).optional().default([]),
  })
  .strict()
  .transform(
    ({
      blog,
      contentMerchandising,
      raTicketing,
      fraudReviewThreshold,
      requireStrongCustomerAuth,
      strictReturnConditions,
      trackingDashboard,
      premierDelivery,
      ...rest
    }) => ({
      ...rest,
      luxuryFeatures: {
        blog,
        contentMerchandising,
        raTicketing,
        fraudReviewThreshold,
        requireStrongCustomerAuth,
        strictReturnConditions,
        trackingDashboard,
        premierDelivery,
      },
    })
  );

export type ProductForm = z.infer<typeof productSchema>;
export type ShopForm = z.infer<typeof shopSchema>;

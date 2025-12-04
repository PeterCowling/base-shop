import { z } from "zod";
import { localeSchema } from "./Product";
import { shopSeoFieldsSchema, lateFeeServiceSchema } from "./Shop";

export const aiCatalogFieldSchema = z.enum([
  "id",
  "title",
  "description",
  "price",
  "media",
]);

export const aiCatalogConfigSchema = z
  .object({
    enabled: z.boolean(),
    fields: z.array(aiCatalogFieldSchema),
    pageSize: z.number().int().positive(),
  })
  .strict();

export const seoSettingsSchema = z
  .object({
    aiCatalog: aiCatalogConfigSchema.optional(),
  })
  .catchall(shopSeoFieldsSchema);

export const stockAlertConfigSchema = z
  .object({
    recipients: z.array(z.string().email()),
    webhook: z.string().url().optional(),
    threshold: z.number().int().positive().optional(),
  })
  .strict();

export const shopSettingsSchema = z
  .object({
    languages: z.array(localeSchema).readonly(),
    seo: seoSettingsSchema,
    analytics: z
      .object({
        enabled: z.boolean().optional(),
        provider: z.string(),
        id: z.string().optional(),
      })
      .strict()
      .optional(),
    leadCapture: z
      .object({
        enabled: z.boolean().optional(),
        provider: z.string().optional(),
        endpoint: z.string().url().optional(),
      })
      .strict()
      .optional(),
    freezeTranslations: z.boolean().optional(),
    /** ISO currency code used as the shop's base currency */
    currency: z.string().length(3).optional(),
    /** Region identifier for tax calculations */
    taxRegion: z.string().optional(),
    depositService: z
      .object({
        enabled: z.boolean(),
        /** Interval in minutes between deposit release checks */
        intervalMinutes: z.number().int().positive(),
      })
      .strict()
      .optional(),
    reverseLogisticsService: z
      .object({
        enabled: z.boolean(),
        intervalMinutes: z.number().int().positive(),
      })
      .strict()
      .optional(),
    lateFeeService: lateFeeServiceSchema.optional(),
    returnService: z
      .object({
        upsEnabled: z.boolean(),
        bagEnabled: z.boolean().optional(),
        homePickupEnabled: z.boolean().optional(),
      })
      .strict()
      .optional(),
    premierDelivery: z
      .object({
        regions: z.array(z.string()),
        windows: z.array(z.string()),
        carriers: z.array(z.string()).default([]),
        surcharge: z.number().int().nonnegative().optional(),
        serviceLabel: z.string().optional(),
      })
      .strict()
      .optional(),
    stockAlert: stockAlertConfigSchema.optional(),
    editorialBlog: z
      .object({
        enabled: z.boolean(),
        promoteSchedule: z.string().optional(),
      })
      .strict()
      .optional(),
    luxuryFeatures: z
      .object({
        blog: z.boolean().default(false),
        contentMerchandising: z.boolean().default(false),
        raTicketing: z.boolean().default(false),
        fraudReviewThreshold: z.number().nonnegative().default(0),
        requireStrongCustomerAuth: z.boolean().default(false),
        strictReturnConditions: z.boolean().default(false),
        trackingDashboard: z.boolean().default(false),
        premierDelivery: z.boolean().default(false),
      })
      .strict()
      .default({
        blog: false,
        contentMerchandising: false,
        raTicketing: false,
        fraudReviewThreshold: 0,
        requireStrongCustomerAuth: false,
        strictReturnConditions: false,
        trackingDashboard: false,
        premierDelivery: false,
      }),
    /** Feature flag to enable or disable all tracking */
    trackingEnabled: z.boolean().default(true).optional(),
    /** Tracking providers enabled for shipment/return tracking */
    trackingProviders: z.array(z.string()).optional(),
    updatedAt: z.string(),
    updatedBy: z.string(),
  })
  .strict();

export type ShopSettings = z.infer<typeof shopSettingsSchema>;
export type AiCatalogConfig = z.infer<typeof aiCatalogConfigSchema>;
export type AiCatalogField = z.infer<typeof aiCatalogFieldSchema>;
export type StockAlertConfig = z.infer<typeof stockAlertConfigSchema>;

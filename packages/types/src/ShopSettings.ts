import { z } from "zod";

import {
  contentLocaleSchema,
  localeSchema,
  uiLocaleSchema,
} from "./Product";
import { lateFeeServiceSchema, shopSeoFieldsSchema } from "./Shop";

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

/**
 * hreflangMap: Maps stored ContentLocale keys to BCP47-ish hreflang values.
 * Used for SEO when regional tags are needed (e.g., "en" → "en-GB").
 * Keys must be a subset of contentLanguages.
 */
export const hreflangMapSchema = z.record(contentLocaleSchema, z.string());

/**
 * Translation settings schema for I18N-PIPE-00.
 * Controls which locales are available for content translation and UI.
 */
export const translationSettingsSchema = z
  .object({
    /**
     * Primary content locale - used as the source locale for translation.
     * Must be one of contentLanguages. Defaults to "en".
     */
    primaryContentLocale: contentLocaleSchema.default("en"),

    /**
     * UI languages - locales with full UI translation bundles.
     * UI chrome uses these locales; requests for other locales fall back to uiLanguages[0].
     */
    uiLanguages: z.array(uiLocaleSchema).readonly().default(["en", "it"]),

    /**
     * Content languages - all locales where content can be created/translated.
     * Superset of required languages. Routing allows these locales.
     */
    contentLanguages: z
      .array(contentLocaleSchema)
      .readonly()
      .default(["en", "it"]),

    /**
     * Required content languages - subset that must be filled before publish.
     * Publish gate blocks if these are missing. Defaults to [primaryContentLocale].
     */
    requiredContentLanguages: z
      .array(contentLocaleSchema)
      .readonly()
      .optional(),

    /**
     * hreflang mapping for SEO - maps content locales to region-specific tags.
     * Example: { "en": "en-GB", "it": "it-IT" }
     */
    hreflangMap: hreflangMapSchema.optional(),

    /**
     * Locale to use for x-default hreflang tag (optional).
     * If not set, no x-default is emitted.
     */
    hreflangDefault: contentLocaleSchema.optional(),
  })
  .strict();

export const shopSettingsSchema = z
  .object({
    /**
     * @deprecated Use translation.contentLanguages instead.
     * Kept for backward compatibility. Will be derived from translation settings if not set.
     */
    languages: z.array(localeSchema).readonly(),

    /**
     * Translation settings (I18N-PIPE-00).
     * Controls locale availability for UI and content.
     */
    translation: translationSettingsSchema.optional(),

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
export type TranslationSettings = z.infer<typeof translationSettingsSchema>;
export type HreflangMap = z.infer<typeof hreflangMapSchema>;
export type AiCatalogConfig = z.infer<typeof aiCatalogConfigSchema>;
export type AiCatalogField = z.infer<typeof aiCatalogFieldSchema>;
export type StockAlertConfig = z.infer<typeof stockAlertConfigSchema>;

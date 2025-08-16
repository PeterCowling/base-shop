import { z } from "zod";
import { localeSchema } from "./Product";
import { subscriptionPlanSchema } from "./SubscriptionPlan";

export const shopSeoFieldsSchema = z
  .object({
    canonicalBase: z.string().url().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    alt: z.string().optional(),
    openGraph: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        url: z.string().url().optional(),
        image: z.string().url().optional(),
      })
      .strict()
      .optional(),
    twitter: z
      .object({
        card: z.string().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.string().url().optional(),
      })
      .strict()
      .optional(),
    structuredData: z.string().optional(),
  })
  .strict();

export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;

export const sanityBlogConfigSchema = z
  .object({
    projectId: z.string(),
    dataset: z.string(),
    token: z.string(),
  })
  .strict();

export type SanityBlogConfig = z.infer<typeof sanityBlogConfigSchema>;

export const shopDomainSchema = z
  .object({
    name: z.string(),
    status: z.string().optional(),
    certificateStatus: z.string().optional(),
  })
  .strict();

export type ShopDomain = z.infer<typeof shopDomainSchema>;

export const lateFeeServiceSchema = z
  .object({
    enabled: z.boolean(),
    /** Interval in minutes between service runs */
    intervalMinutes: z.number().int().positive(),
  })
  .strict();

export type LateFeeService = z.infer<typeof lateFeeServiceSchema>;

export const shopSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    logo: z.string().optional(),
    contactInfo: z.string().optional(),
    catalogFilters: z.array(z.string()),
    themeId: z.string(),
    /** Mapping of design tokens to original theme values */
    themeDefaults: z.record(z.string()).default({}),
    /** Mapping of token overrides to theme values */
    themeOverrides: z.record(z.string()).default({}),
    /** Mapping of design tokens to theme values (defaults merged with overrides) */
    themeTokens: z.record(z.string()).default({}),
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: z.record(z.string()),
    /** Optional price overrides per locale (minor units) */
    priceOverrides: z
      .record(localeSchema, z.number().int().nonnegative())
      .default({}),
    /** Optional redirect overrides for locale detection */
    localeOverrides: z.record(z.string(), localeSchema).default({}),
    /**
     * Shop business model.
     * "sale" indicates a traditional commerce shop while "rental" enables
     * rental-specific features.
     */
    type: z.string().optional(),
    paymentProviders: z.array(z.string()).optional(),
    shippingProviders: z.array(z.string()).optional(),
    taxProviders: z.array(z.string()).optional(),
    billingProvider: z.string().optional(),
    homeTitle: z.record(localeSchema, z.string()).optional(),
    homeDescription: z.record(localeSchema, z.string()).optional(),
    homeImage: z.string().optional(),
    navigation: z
      .array(z.object({ label: z.string(), url: z.string() }).strict())
      .optional(),
    sanityBlog: sanityBlogConfigSchema.optional(),
    editorialBlog: z
      .object({
        enabled: z.boolean(),
        promoteSchedule: z.string().optional(),
      })
      .strict()
      .optional(),
    enableEditorial: z.boolean().optional(),
    domain: shopDomainSchema.optional(),
    returnPolicyUrl: z.string().url().optional(),
    returnsEnabled: z.boolean().optional(),
    analyticsEnabled: z.boolean().optional(),
    coverageIncluded: z.boolean().default(true),
    showCleaningTransparency: z.boolean().optional(),
    rentalInventoryAllocation: z.boolean().optional(),
    luxuryFeatures: z
      .object({
        contentMerchandising: z.boolean().default(false),
        raTicketing: z.boolean().default(false),
        fraudReviewThreshold: z.number().nonnegative().default(0),
        requireStrongCustomerAuth: z.boolean().default(false),
        returns: z.boolean().default(false),
        strictReturnConditions: z.boolean().default(false),
      })
      .strict()
      .default({
        contentMerchandising: false,
        raTicketing: false,
        fraudReviewThreshold: 0,
        requireStrongCustomerAuth: false,
        returns: false,
        strictReturnConditions: false,
      }),
    lastUpgrade: z.string().datetime().optional(),
    componentVersions: z.record(z.string()).default({}),
    rentalSubscriptions: z
      .array(subscriptionPlanSchema)
      .default([]),
    /**
     * Feature flag to enable rental subscription flows.
     * Sale-only shops should leave this disabled to retain
     * traditional purchasing behavior.
     */
    subscriptionsEnabled: z.boolean().default(false),
    lateFeePolicy: z
      .object({
        gracePeriodDays: z.number().int().nonnegative(),
        feeAmount: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type Shop = z.infer<typeof shopSchema>;

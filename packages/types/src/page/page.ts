import { z } from "zod";
import { localeSchema } from "../Product";
import type { Locale } from "../constants";
import {
  imageComponentSchema,
  textComponentSchema,
  customHtmlComponentSchema,
  buttonComponentSchema,
  dividerComponentSchema,
  spacerComponentSchema,
} from "./atoms";
import {
  announcementBarComponentSchema,
  valuePropsComponentSchema,
  reviewsCarouselComponentSchema,
  contactFormComponentSchema,
  headerCartComponentSchema,
  newsletterSignupComponentSchema,
  searchBarComponentSchema,
  mapBlockComponentSchema,
  videoBlockComponentSchema,
  faqBlockComponentSchema,
  countdownTimerComponentSchema,
  socialLinksComponentSchema,
  socialFeedComponentSchema,
  socialProofComponentSchema,
} from "./molecules";
import {
  heroBannerComponentSchema,
  productGridComponentSchema,
  productCarouselComponentSchema,
  recommendationCarouselComponentSchema,
  galleryComponentSchema,
  lookbookComponentSchema,
  campaignHeroSectionComponentSchema,
  promoTilesSectionComponentSchema,
  showcaseSectionComponentSchema,
  reviewsSectionComponentSchema,
  crossSellSectionComponentSchema,
  imageSliderComponentSchema,
  contactFormWithMapComponentSchema,
  storeLocatorBlockComponentSchema,
  blogListingComponentSchema,
  testimonialsComponentSchema,
  pricingTableComponentSchema,
  testimonialSliderComponentSchema,
  giftCardBlockComponentSchema,
  popupModalComponentSchema,
  collectionListComponentSchema,
  featuredProductComponentSchema,
  productComparisonComponentSchema,
  formBuilderBlockComponentSchema,
  productBundleComponentSchema,
  productFilterComponentSchema,
  financingBadgeComponentSchema,
  certificateCheckComponentSchema,
  policiesAccordionComponentSchema,
  stickyBuyBarComponentSchema,
  pdpDetailsSectionComponentSchema,
  guidedSellingSectionComponentSchema,
  cartSectionComponentSchema,
  checkoutSectionComponentSchema,
  thankYouSectionComponentSchema,
  storeLocatorSectionComponentSchema,
  emailReferralSectionComponentSchema,
  dsarSectionComponentSchema,
  ageGateSectionComponentSchema,
  accountSectionComponentSchema,
  rentalManageSectionComponentSchema,
} from "./organisms";
import {
  headerComponentSchema,
  footerComponentSchema,
  sectionComponentSchema,
  multiColumnComponentSchema,
  tabsComponentSchema,
  stackFlexComponentSchema,
  gridContainerComponentSchema,
  carouselContainerComponentSchema,
  tabsAccordionContainerComponentSchema,
  bindPageComponentSchema,
  datasetComponentSchema,
  repeaterComponentSchema,
  bindComponentSchema,
} from "./layouts";

// Add an explicit annotation to prevent TS from attempting to serialize the
// enormous inferred discriminated union type (TS7056).
export const pageComponentSchema: z.ZodTypeAny = z.lazy(() =>
  z.discriminatedUnion("type", [
    announcementBarComponentSchema,
    heroBannerComponentSchema,
    valuePropsComponentSchema,
    reviewsCarouselComponentSchema,
    productGridComponentSchema,
    productCarouselComponentSchema,
    recommendationCarouselComponentSchema,
    galleryComponentSchema,
    lookbookComponentSchema,
    campaignHeroSectionComponentSchema,
    promoTilesSectionComponentSchema,
    showcaseSectionComponentSchema,
    reviewsSectionComponentSchema,
    crossSellSectionComponentSchema,
    imageSliderComponentSchema,
    contactFormComponentSchema,
    newsletterSignupComponentSchema,
    headerCartComponentSchema,
    searchBarComponentSchema,
    contactFormWithMapComponentSchema,
    mapBlockComponentSchema,
    storeLocatorBlockComponentSchema,
    videoBlockComponentSchema,
    faqBlockComponentSchema,
    countdownTimerComponentSchema,
    headerComponentSchema,
    footerComponentSchema,
    socialLinksComponentSchema,
    socialFeedComponentSchema,
    socialProofComponentSchema,
    blogListingComponentSchema,
    testimonialsComponentSchema,
    pricingTableComponentSchema,
    giftCardBlockComponentSchema,
    popupModalComponentSchema,
    testimonialSliderComponentSchema,
    featuredProductComponentSchema,
    productComparisonComponentSchema,
    formBuilderBlockComponentSchema,
    productBundleComponentSchema,
    productFilterComponentSchema,
    financingBadgeComponentSchema,
    certificateCheckComponentSchema,
    policiesAccordionComponentSchema,
    stickyBuyBarComponentSchema,
    pdpDetailsSectionComponentSchema,
    guidedSellingSectionComponentSchema,
    cartSectionComponentSchema,
    checkoutSectionComponentSchema,
    thankYouSectionComponentSchema,
    storeLocatorSectionComponentSchema,
    emailReferralSectionComponentSchema,
    dsarSectionComponentSchema,
    ageGateSectionComponentSchema,
    accountSectionComponentSchema,
    rentalManageSectionComponentSchema,
    imageComponentSchema,
    textComponentSchema,
    customHtmlComponentSchema,
    buttonComponentSchema,
    dividerComponentSchema,
    spacerComponentSchema,
    sectionComponentSchema,
    multiColumnComponentSchema,
    tabsComponentSchema,
    stackFlexComponentSchema,
    gridContainerComponentSchema,
    carouselContainerComponentSchema,
    tabsAccordionContainerComponentSchema,
    datasetComponentSchema,
    repeaterComponentSchema,
    bindComponentSchema,
    collectionListComponentSchema,
  ])
);

export type PageComponent = z.infer<typeof pageComponentSchema>;

bindPageComponentSchema(pageComponentSchema);

export interface EditorFlags {
  name?: string;
  locked?: boolean;
  zIndex?: number;
  hidden?: ("desktop" | "tablet" | "mobile")[];
  /** Custom device ids (page-defined breakpoints) to hide this node on */
  hiddenDeviceIds?: string[];
  /** Legacy single stacking strategy applied on mobile (kept for backwards-compat). */
  stackStrategy?: "default" | "reverse" | "custom";
  /** Per-device stacking strategies */
  stackDesktop?: "default" | "reverse" | "custom";
  stackTablet?: "default" | "reverse" | "custom";
  stackMobile?: "default" | "reverse" | "custom";
  /** Per-device custom order values (used when the corresponding strategy === "custom") */
  orderDesktop?: number;
  orderTablet?: number;
  /** Per-node custom mobile order (used when stackStrategy = custom on parent) */
  orderMobile?: number;
  /** Builder-only metadata for global (linked) components */
  global?: {
    id: string;
    overrides?: unknown;
    pinned?: boolean;
    /** Per-viewport editing width overrides in the builder (px) */
    editingSize?: Partial<Record<"desktop" | "tablet" | "mobile", number | null>>;
  };
}

export interface HistoryState {
  past: PageComponent[][];
  present: PageComponent[];
  future: PageComponent[][];
  gridCols: number;
  editor?: Record<string, EditorFlags>;
  [key: string]: unknown;
}

const pageComponentHistoryStackSchema = z.array(pageComponentSchema);
const pageComponentHistoryTimelineSchema = z.array(
  pageComponentHistoryStackSchema
);

export const historyStateSchema = z
  .object({
    past: pageComponentHistoryTimelineSchema.default([]),
    present: pageComponentHistoryStackSchema.default([]),
    future: pageComponentHistoryTimelineSchema.default([]),
    gridCols: z.number().int().min(1).max(24).default(12),
    editor: z
      .record(
        z.object({
          name: z.string().optional(),
          locked: z.boolean().optional(),
          zIndex: z.number().int().optional(),
          hidden: z.array(z.enum(["desktop", "tablet", "mobile"])).optional(),
          hiddenDeviceIds: z.array(z.string()).optional(),
          // Legacy single strategy (mobile); kept for backwards-compat
          stackStrategy: z.enum(["default", "reverse", "custom"]).optional(),
          // Per-device stacking strategies
          stackDesktop: z.enum(["default", "reverse", "custom"]).optional(),
          stackTablet: z.enum(["default", "reverse", "custom"]).optional(),
          stackMobile: z.enum(["default", "reverse", "custom"]).optional(),
          // Per-device custom order values
          orderDesktop: z.number().int().nonnegative().optional(),
          orderTablet: z.number().int().nonnegative().optional(),
          orderMobile: z.number().int().nonnegative().optional(),
          global: z
            .object({
              id: z.string(),
              overrides: z.unknown().optional(),
              pinned: z.boolean().optional(),
              editingSize: z
                .object({
                  desktop: z.number().int().min(320).max(1920).nullable().optional(),
                  tablet: z.number().int().min(320).max(1920).nullable().optional(),
                  mobile: z.number().int().min(320).max(1920).nullable().optional(),
                })
                .partial()
                .optional(),
            })
            .optional(),
        })
      )
      .default({})
      .optional(),
  })
  .passthrough()
  .default({ past: [], present: [], future: [], gridCols: 12, editor: {} }) as unknown as z.ZodType<HistoryState>;

export interface Page {
  id: string;
  /** Stable ID used for deterministic code generation */
  stableId?: string;
  slug: string;
  status: "draft" | "published";
  /** Timestamp of the most recent successful publish */
  publishedAt?: string;
  /** User id/email that performed the most recent publish */
  publishedBy?: string;
  /** Optional revision/hash for the last published snapshot */
  publishedRevisionId?: string;
  /** Optional snapshot of the last published components for easy revert */
  lastPublishedComponents?: PageComponent[];
  /** Navigation/Sitemap visibility. Defaults to "public". */
  visibility?: "public" | "hidden";
  components: PageComponent[];
  seo: {
    title: Partial<Record<Locale, string>>;
    description?: Partial<Record<Locale, string>>;
    image?: Partial<Record<Locale, string>>;
    /** When true, exclude from sitemaps and add robots noindex. */
    noindex?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  history?: HistoryState;
}

export const pageSchema = z
  .object({
    id: z.string(),
    stableId: z.string().optional(),
    slug: z.string(),
    status: z.enum(["draft", "published"]),
    publishedAt: z.string().optional(),
    publishedBy: z.string().optional(),
    publishedRevisionId: z.string().optional(),
    lastPublishedComponents: z.array(pageComponentSchema).optional(),
    visibility: z.enum(["public", "hidden"]).optional(),
    components: z.array(pageComponentSchema).default([]),
    seo: z.object({
      title: z.record(localeSchema, z.string()),
      description: z.record(localeSchema, z.string()).optional(),
      image: z.record(localeSchema, z.string()).optional(),
      noindex: z.boolean().optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
    history: historyStateSchema.optional(),
  })
  .strict() as z.ZodSchema<Page>;

// Re-export locale schema for callers that import from "./page"
export { localeSchema };


export { scaffoldSpecSchema } from "./ScaffoldSpec";
export type { ScaffoldSpec } from "./ScaffoldSpec";

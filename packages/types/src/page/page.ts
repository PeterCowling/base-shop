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
} from "./organisms";
import {
  headerComponentSchema,
  footerComponentSchema,
  sectionComponentSchema,
  multiColumnComponentSchema,
  tabsComponentSchema,
  bindPageComponentSchema,
} from "./layouts";

export const pageComponentSchema = z.lazy(() =>
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
    imageSliderComponentSchema,
    contactFormComponentSchema,
    newsletterSignupComponentSchema,
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
    imageComponentSchema,
    textComponentSchema,
    customHtmlComponentSchema,
    buttonComponentSchema,
    dividerComponentSchema,
    spacerComponentSchema,
    sectionComponentSchema,
    multiColumnComponentSchema,
    tabsComponentSchema,
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
  /** Container child stacking strategy applied on mobile */
  stackStrategy?: "default" | "reverse";
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
          hidden: z.array(z.enum(["desktop", "tablet", "mobile"]))
            .optional(),
          stackStrategy: z.enum(["default", "reverse"]).optional(),
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
  components: PageComponent[];
  seo: {
    title: Partial<Record<Locale, string>>;
    description?: Partial<Record<Locale, string>>;
    image?: Partial<Record<Locale, string>>;
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
    components: z.array(pageComponentSchema).default([]),
    seo: z.object({
      title: z.record(localeSchema, z.string()),
      description: z.record(localeSchema, z.string()).optional(),
      image: z.record(localeSchema, z.string()).optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
    history: historyStateSchema.optional(),
  })
  .strict() as z.ZodSchema<Page>;


export { scaffoldSpecSchema } from "./ScaffoldSpec";
export type { ScaffoldSpec } from "./ScaffoldSpec";

import { z } from "zod";
import { localeSchema } from "../Product";
import type { Locale } from "../constants";
import {
  imageComponentSchema,
  textComponentSchema,
  customHtmlComponentSchema,
  buttonComponentSchema,
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
    imageComponentSchema,
    textComponentSchema,
    customHtmlComponentSchema,
    buttonComponentSchema,
    sectionComponentSchema,
    multiColumnComponentSchema,
    tabsComponentSchema,
    collectionListComponentSchema,
  ])
);

export type PageComponent = z.infer<typeof pageComponentSchema>;

bindPageComponentSchema(pageComponentSchema);

export const historyStateSchema = z
  .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
    gridCols: z.number().int().min(1).max(24).default(12),
  })
  .strict()
  .default({ past: [], present: [], future: [], gridCols: 12 });

export type HistoryState = z.infer<typeof historyStateSchema>;

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

import { z } from "zod";
import { localeSchema } from "../Product";
import {
  ImageComponent,
  imageComponentSchema,
  TextComponent,
  textComponentSchema,
  CustomHtmlComponent,
  customHtmlComponentSchema,
  ButtonComponent,
  buttonComponentSchema,
} from "./atoms";
import {
  AnnouncementBarComponent,
  announcementBarComponentSchema,
  ValuePropsComponent,
  valuePropsComponentSchema,
  ReviewsCarouselComponent,
  reviewsCarouselComponentSchema,
  ContactFormComponent,
  contactFormComponentSchema,
  NewsletterSignupComponent,
  newsletterSignupComponentSchema,
  SearchBarComponent,
  searchBarComponentSchema,
  MapBlockComponent,
  mapBlockComponentSchema,
  VideoBlockComponent,
  videoBlockComponentSchema,
  FAQBlockComponent,
  faqBlockComponentSchema,
  CountdownTimerComponent,
  countdownTimerComponentSchema,
  SocialLinksComponent,
  socialLinksComponentSchema,
  SocialFeedComponent,
  socialFeedComponentSchema,
  SocialProofComponent,
  socialProofComponentSchema,
} from "./molecules";
import {
  HeroBannerComponent,
  heroBannerComponentSchema,
  ProductGridComponent,
  productGridComponentSchema,
  ProductCarouselComponent,
  productCarouselComponentSchema,
  RecommendationCarouselComponent,
  recommendationCarouselComponentSchema,
  GalleryComponent,
  galleryComponentSchema,
  LookbookComponent,
  lookbookComponentSchema,
  ImageSliderComponent,
  imageSliderComponentSchema,
  ContactFormWithMapComponent,
  contactFormWithMapComponentSchema,
  StoreLocatorBlockComponent,
  storeLocatorBlockComponentSchema,
  BlogListingComponent,
  blogListingComponentSchema,
  TestimonialsComponent,
  testimonialsComponentSchema,
  PricingTableComponent,
  pricingTableComponentSchema,
  TestimonialSliderComponent,
  testimonialSliderComponentSchema,
  GiftCardBlockComponent,
  giftCardBlockComponentSchema,
  PopupModalComponent,
  popupModalComponentSchema,
  CollectionListComponent,
} from "./organisms";
import {
  HeaderComponent,
  headerComponentSchema,
  FooterComponent,
  footerComponentSchema,
  SectionComponent,
  sectionComponentSchema,
  MultiColumnComponent,
  multiColumnComponentSchema,
  TabsComponent,
  tabsComponentSchema,
  bindPageComponentSchema,
} from "./layouts";

export type PageComponent =
  | AnnouncementBarComponent
  | HeroBannerComponent
  | ValuePropsComponent
  | ReviewsCarouselComponent
  | ProductGridComponent
  | ProductCarouselComponent
  | RecommendationCarouselComponent
  | GalleryComponent
  | LookbookComponent
  | ImageSliderComponent
  | ContactFormComponent
  | NewsletterSignupComponent
  | SearchBarComponent
  | ContactFormWithMapComponent
  | MapBlockComponent
  | StoreLocatorBlockComponent
  | VideoBlockComponent
  | FAQBlockComponent
  | CountdownTimerComponent
  | BlogListingComponent
  | TestimonialsComponent
  | PricingTableComponent
  | TestimonialSliderComponent
  | GiftCardBlockComponent
  | PopupModalComponent
  | ImageComponent
  | TextComponent
  | CustomHtmlComponent
  | ButtonComponent
  | HeaderComponent
  | FooterComponent
  | SocialLinksComponent
  | SocialFeedComponent
  | SocialProofComponent
  | SectionComponent
  | MultiColumnComponent
  | TabsComponent
  | CollectionListComponent;

export const pageComponentSchema: z.ZodType<PageComponent> = z.lazy(() =>
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
  ])
);

bindPageComponentSchema(pageComponentSchema);

export interface HistoryState {
  past: PageComponent[][];
  present: PageComponent[];
  future: PageComponent[][];
  gridCols: number;
}

export const historyStateSchema: z.ZodType<HistoryState> = z
  .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
    gridCols: z.number().int().min(1).max(24).default(12),
  })
  .strict()
  .default({ past: [], present: [], future: [], gridCols: 12 });

export const pageSchema = z
  .object({
    id: z.string(),
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
  .strict();

export type Page = z.infer<typeof pageSchema>;


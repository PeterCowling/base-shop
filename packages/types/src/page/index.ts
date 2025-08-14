import { z } from "zod";
import { localeSchema } from "../Product";

export * from "./base";
export * from "./header";
export * from "./footer";
export * from "./social-links";
export * from "./social-feed";
export * from "./social-proof";
export * from "./announcement-bar";
export * from "./hero-banner";
export * from "./value-props";
export * from "./reviews-carousel";
export * from "./product-grid";
export * from "./product-carousel";
export * from "./collection-list";
export * from "./recommendation-carousel";
export * from "./gallery";
export * from "./image-slider";
export * from "./contact-form";
export * from "./newsletter-signup";
export * from "./search-bar";
export * from "./contact-form-with-map";
export * from "./map-block";
export * from "./store-locator-block";
export * from "./video-block";
export * from "./faq-block";
export * from "./countdown-timer";
export * from "./image";
export * from "./blog-listing";
export * from "./testimonial-slider";
export * from "./testimonials";
export * from "./pricing-table";
export * from "./gift-card-block";
export * from "./popup-modal";
export * from "./text";
export * from "./custom-html";
export * from "./button";
export * from "./section";
export * from "./multi-column";
export * from "./tabs";

import { HeaderComponent, headerComponentSchema } from "./header";
import { FooterComponent, footerComponentSchema } from "./footer";
import { SocialLinksComponent, socialLinksComponentSchema } from "./social-links";
import { SocialFeedComponent, socialFeedComponentSchema } from "./social-feed";
import { SocialProofComponent, socialProofComponentSchema } from "./social-proof";
import { AnnouncementBarComponent, announcementBarComponentSchema } from "./announcement-bar";
import { HeroBannerComponent, heroBannerComponentSchema } from "./hero-banner";
import { ValuePropsComponent, valuePropsComponentSchema } from "./value-props";
import { ReviewsCarouselComponent, reviewsCarouselComponentSchema } from "./reviews-carousel";
import { ProductGridComponent, productGridComponentSchema } from "./product-grid";
import { ProductCarouselComponent, productCarouselComponentSchema } from "./product-carousel";
import type { CollectionListComponent } from "./collection-list";
import { RecommendationCarouselComponent, recommendationCarouselComponentSchema } from "./recommendation-carousel";
import { GalleryComponent, galleryComponentSchema } from "./gallery";
import type { ImageSliderComponent } from "./image-slider";
import { ContactFormComponent, contactFormComponentSchema } from "./contact-form";
import { NewsletterSignupComponent, newsletterSignupComponentSchema } from "./newsletter-signup";
import { SearchBarComponent, searchBarComponentSchema } from "./search-bar";
import { ContactFormWithMapComponent, contactFormWithMapComponentSchema } from "./contact-form-with-map";
import { MapBlockComponent, mapBlockComponentSchema } from "./map-block";
import { StoreLocatorBlockComponent, storeLocatorBlockComponentSchema } from "./store-locator-block";
import { VideoBlockComponent, videoBlockComponentSchema } from "./video-block";
import { FAQBlockComponent, faqBlockComponentSchema } from "./faq-block";
import { CountdownTimerComponent, countdownTimerComponentSchema } from "./countdown-timer";
import { ImageComponent, imageComponentSchema } from "./image";
import { BlogListingComponent, blogListingComponentSchema } from "./blog-listing";
import { TestimonialSliderComponent, testimonialSliderComponentSchema } from "./testimonial-slider";
import { TestimonialsComponent, testimonialsComponentSchema } from "./testimonials";
import { PricingTableComponent, pricingTableComponentSchema } from "./pricing-table";
import { GiftCardBlockComponent, giftCardBlockComponentSchema } from "./gift-card-block";
import { PopupModalComponent, popupModalComponentSchema } from "./popup-modal";
import { TextComponent, textComponentSchema } from "./text";
import { CustomHtmlComponent, customHtmlComponentSchema } from "./custom-html";
import { ButtonComponent, buttonComponentSchema } from "./button";
import { SectionComponent, createSectionComponentSchema } from "./section";
import { MultiColumnComponent, createMultiColumnComponentSchema } from "./multi-column";
import { TabsComponent, createTabsComponentSchema } from "./tabs";

export type PageComponent =
  | HeaderComponent
  | FooterComponent
  | SocialLinksComponent
  | SocialFeedComponent
  | SocialProofComponent
  | AnnouncementBarComponent
  | HeroBannerComponent
  | ValuePropsComponent
  | ReviewsCarouselComponent
  | ProductGridComponent
  | ProductCarouselComponent
  | CollectionListComponent
  | RecommendationCarouselComponent
  | GalleryComponent
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
  | ImageComponent
  | BlogListingComponent
  | TestimonialSliderComponent
  | TestimonialsComponent
  | PricingTableComponent
  | GiftCardBlockComponent
  | PopupModalComponent
  | TextComponent
  | CustomHtmlComponent
  | ButtonComponent
  | SectionComponent
  | MultiColumnComponent
  | TabsComponent;

const sectionComponentSchema = createSectionComponentSchema(() => pageComponentSchema);
const multiColumnComponentSchema = createMultiColumnComponentSchema(() => pageComponentSchema);
const tabsComponentSchema = createTabsComponentSchema(() => pageComponentSchema);

export const pageComponentSchema: z.ZodType<PageComponent> = z.lazy(() =>
  z.discriminatedUnion("type", [
    headerComponentSchema,
    footerComponentSchema,
    socialLinksComponentSchema,
    socialFeedComponentSchema,
    socialProofComponentSchema,
    announcementBarComponentSchema,
    heroBannerComponentSchema,
    valuePropsComponentSchema,
    reviewsCarouselComponentSchema,
    productGridComponentSchema,
    productCarouselComponentSchema,
    recommendationCarouselComponentSchema,
    galleryComponentSchema,
    contactFormComponentSchema,
    newsletterSignupComponentSchema,
    searchBarComponentSchema,
    contactFormWithMapComponentSchema,
    mapBlockComponentSchema,
    storeLocatorBlockComponentSchema,
    videoBlockComponentSchema,
    faqBlockComponentSchema,
    countdownTimerComponentSchema,
    imageComponentSchema,
    blogListingComponentSchema,
    testimonialSliderComponentSchema,
    testimonialsComponentSchema,
    pricingTableComponentSchema,
    giftCardBlockComponentSchema,
    popupModalComponentSchema,
    textComponentSchema,
    customHtmlComponentSchema,
    buttonComponentSchema,
    sectionComponentSchema,
    multiColumnComponentSchema,
    tabsComponentSchema
  ] as any) as unknown as z.ZodType<PageComponent>
);

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
  .default({ past: [], present: [], future: [], gridCols: 12 }) as unknown as z.ZodType<HistoryState>;

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
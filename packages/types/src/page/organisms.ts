import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "./base";

export interface HeroBannerComponent extends PageComponentBase {
  type: "HeroBanner";
  slides?: { src: string; alt?: string; headlineKey: string; ctaKey: string }[];
}

export const heroBannerComponentSchema = baseComponentSchema.extend({
  type: z.literal("HeroBanner"),
  slides: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string().optional(),
        headlineKey: z.string(),
        ctaKey: z.string(),
      })
    )
    .optional(),
});

export interface ProductGridComponent extends PageComponentBase {
  type: "ProductGrid";
  skus?: string[];
  collectionId?: string;
  mode?: "collection" | "manual";
  /** Enable product quick view modal */
  quickView?: boolean;
}

export const productGridComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductGrid"),
});

export interface ProductCarouselComponent extends PageComponentBase {
  type: "ProductCarousel";
  skus?: string[];
  collectionId?: string;
  mode?: "collection" | "manual";
  /** Enable product quick view modal */
  quickView?: boolean;
}

export const productCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("ProductCarousel"),
});

export interface RecommendationCarouselComponent extends PageComponentBase {
  type: "RecommendationCarousel";
  endpoint: string;
}

export const recommendationCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("RecommendationCarousel"),
  endpoint: z.string(),
});

export interface GalleryComponent extends PageComponentBase {
  type: "Gallery";
  images?: { src: string; alt?: string }[];
}

export const galleryComponentSchema = baseComponentSchema.extend({
  type: z.literal("Gallery"),
  images: z
    .array(z.object({ src: z.string(), alt: z.string().optional() }))
    .optional(),
});

export interface LookbookComponent extends PageComponentBase {
  type: "Lookbook";
  src?: string;
  alt?: string;
  hotspots?: { sku?: string; x: number; y: number }[];
}

export const lookbookComponentSchema = baseComponentSchema.extend({
  type: z.literal("Lookbook"),
  src: z.string().optional(),
  alt: z.string().optional(),
  hotspots: z
    .array(
      z.object({
        sku: z.string().optional(),
        x: z.number(),
        y: z.number(),
      })
    )
    .optional(),
});

export interface ImageSliderComponent extends PageComponentBase {
  type: "ImageSlider";
  slides?: { src: string; alt?: string; caption?: string }[];
  minItems?: number;
  maxItems?: number;
}

export const imageSliderComponentSchema = baseComponentSchema.extend({
  type: z.literal("ImageSlider"),
  slides: z
    .array(z.object({ src: z.string(), alt: z.string().optional(), caption: z.string().optional() }))
    .optional(),
  minItems: z.number().optional(),
  maxItems: z.number().optional(),
});

export interface ContactFormWithMapComponent extends PageComponentBase {
  type: "ContactFormWithMap";
  mapSrc?: string;
}

export const contactFormWithMapComponentSchema = baseComponentSchema.extend({
  type: z.literal("ContactFormWithMap"),
  mapSrc: z.string().optional(),
});

export interface StoreLocatorBlockComponent extends PageComponentBase {
  type: "StoreLocatorBlock";
  locations?: { lat?: number; lng?: number; label?: string }[];
  zoom?: number;
}

export const storeLocatorBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("StoreLocatorBlock"),
  locations: z
    .array(
      z.object({
        lat: z.number().optional(),
        lng: z.number().optional(),
        label: z.string().optional(),
      })
    )
    .optional(),
  zoom: z.number().optional(),
});

export interface BlogListingComponent extends PageComponentBase {
  type: "BlogListing";
  posts?: { title: string; excerpt?: string; url?: string; shopUrl?: string }[];
}

export const blogListingComponentSchema = baseComponentSchema.extend({
  type: z.literal("BlogListing"),
  posts: z
    .array(
      z.object({
        title: z.string(),
        excerpt: z.string().optional(),
        url: z.string().optional(),
        shopUrl: z.string().optional(),
      })
    )
    .optional(),
});

export interface TestimonialsComponent extends PageComponentBase {
  type: "Testimonials";
  testimonials?: { quote: string; name?: string }[];
}

export const testimonialsComponentSchema = baseComponentSchema.extend({
  type: z.literal("Testimonials"),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string().optional() }))
    .optional(),
});

export interface PricingTableComponent extends PageComponentBase {
  type: "PricingTable";
  plans?: {
    title: string;
    price: string;
    features: string[];
    ctaLabel: string;
    ctaHref: string;
    featured?: boolean;
  }[];
}

export const pricingTableComponentSchema = baseComponentSchema.extend({
  type: z.literal("PricingTable"),
  plans: z
    .array(
      z.object({
        title: z.string(),
        price: z.string(),
        features: z.array(z.string()),
        ctaLabel: z.string(),
        ctaHref: z.string(),
        featured: z.boolean().optional(),
      })
    )
    .optional(),
});

export interface TestimonialSliderComponent extends PageComponentBase {
  type: "TestimonialSlider";
  testimonials?: { quote: string; name?: string }[];
}

export const testimonialSliderComponentSchema = baseComponentSchema.extend({
  type: z.literal("TestimonialSlider"),
  testimonials: z
    .array(z.object({ quote: z.string(), name: z.string().optional() }))
    .optional(),
});

export interface GiftCardBlockComponent extends PageComponentBase {
  type: "GiftCardBlock";
  denominations?: number[];
  description?: string;
}

export const giftCardBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("GiftCardBlock"),
  denominations: z.array(z.number()).optional(),
  description: z.string().optional(),
});

export interface PopupModalComponent extends PageComponentBase {
  type: "PopupModal";
  trigger?: "load" | "delay" | "exit";
  delay?: number;
  content?: string;
}

export const popupModalComponentSchema = baseComponentSchema.extend({
  type: z.literal("PopupModal"),
  trigger: z.enum(["load", "delay", "exit"]).optional(),
  delay: z.number().int().min(0).optional(),
  content: z.string().optional(),
});

// Interface without corresponding schema
export interface CollectionListComponent extends PageComponentBase {
  type: "CollectionList";
  collections?: { id: string; title: string; image: string }[];
  desktopItems?: number;
  tabletItems?: number;
  mobileItems?: number;
}


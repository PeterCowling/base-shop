// src/routes/guides/cheapEatsInPositano/constants.ts
import type { BreadcrumbList } from "@/components/seo/BreadcrumbStructuredData";

export const GUIDE_KEY = "cheapEats" as const;
export const GUIDE_SLUG = "cheap-eats-in-positano" as const;
export const HERO_IMAGE_PATH = "/img/positano-cheap-eats.avif" as const;
export const JSON_LD_TYPE = "application/ld+json" as const;
export const RECOMMENDATIONS_SECTION_ID = "recommendations" as const;
export const FAQ_SECTION_ID = "faqs" as const;
export const GALLERY_SECTION_ID = "gallery" as const;

export const handle = { tags: ["budgeting", "cuisine", "positano"] } as const;

export type Recommendation = { name: string; note?: string };

export type GalleryCopy = { alt: string; caption: string };

export type TocConfig = {
  title?: string;
  faqs?: string;
  recommendations?: string;
};

export type StructuredSection = {
  id: string;
  title: string;
  body: string[];
};

export type StructuredFaq = {
  q: string;
  a: string[];
};

export type GalleryItem = {
  src: string;
  alt: string;
  caption?: string;
};

export type CheapEatsMetaData = {
  title: string;
  description: string;
  hero: string;
  breadcrumb: BreadcrumbList;
  itemListJson: string;
};

export type CheapEatsArticleData = {
  title: string;
  heroAlt: string;
  hasStructured: boolean;
  structuredIntro: string[];
  structuredSections: StructuredSection[];
  structuredFaqs: StructuredFaq[];
  recommendations: Recommendation[];
  recommendationsHeading: string;
  recommendationsTocLabel: string;
  fallbackWhereToEatLabel: string;
  faqHeading: string;
  faqTocLabel: string;
  fallbackFaqLabel: string;
  fallbackIntro: string[];
  fallbackFaqs: StructuredFaq[];
  galleryHeading: string;
  galleryItems: GalleryItem[];
  tocTitle?: string;
};

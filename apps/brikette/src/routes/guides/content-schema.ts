// src/routes/guides/content-schema.ts
import { z } from "zod";

const nonEmptyString = z.string().min(1);

const STRING_ARRAY = z.array(nonEmptyString);

const SEO_SCHEMA = z
  .object({
    title: nonEmptyString,
    description: nonEmptyString,
  })
  .passthrough();

const GUIDE_SECTION_SCHEMA = z
  .object({
    id: nonEmptyString.optional(),
    title: nonEmptyString,
    body: STRING_ARRAY.optional(),
    list: STRING_ARRAY.optional(),
  })
  .passthrough();

const FAQ_ENTRY_SCHEMA = z
  .object({
    q: nonEmptyString,
    a: STRING_ARRAY,
  })
  .passthrough();

const RECOMMENDATION_SCHEMA = z
  .object({
    name: nonEmptyString,
    note: nonEmptyString.optional(),
    href: nonEmptyString.optional(),
  })
  .passthrough();

const GALLERY_ITEM_SCHEMA = z
  .object({
    alt: nonEmptyString,
    caption: nonEmptyString.optional(),
    title: nonEmptyString.optional(),
    src: nonEmptyString.optional(),
  })
  .passthrough();

const GALLERY_SCHEMA = z
  .object({
    items: z.array(GALLERY_ITEM_SCHEMA).min(1),
    title: nonEmptyString.optional(),
  })
  .passthrough();

const STRUCTURED_LIST_ENTRY_SCHEMA = z.union([nonEmptyString, RECOMMENDATION_SCHEMA]);

export const GUIDE_CONTENT_SCHEMA = z
  .object({
    seo: SEO_SCHEMA,
    linkLabel: nonEmptyString.optional(),
    heroAlt: nonEmptyString.optional(),
    intro: STRING_ARRAY.optional(),
    fallbackIntro: STRING_ARRAY.optional(),
    sections: z.array(GUIDE_SECTION_SCHEMA).optional(),
    faqs: z.array(FAQ_ENTRY_SCHEMA).optional(),
    fallbackFaqs: z.array(FAQ_ENTRY_SCHEMA).optional(),
    recommendations: z.array(RECOMMENDATION_SCHEMA).optional(),
    fallbackRecommendations: z.array(RECOMMENDATION_SCHEMA).optional(),
    gallery: GALLERY_SCHEMA.optional(),
    fallbackGalleryItems: z.array(GALLERY_ITEM_SCHEMA).optional(),
    tips: STRING_ARRAY.optional(),
    tipsTitle: nonEmptyString.optional(),
    warnings: STRING_ARRAY.optional(),
    warningsTitle: nonEmptyString.optional(),
    tocTitle: nonEmptyString.optional(),
    faqsTitle: nonEmptyString.optional(),
    galleryTitle: nonEmptyString.optional(),
    serviceType: nonEmptyString.optional(),
    areaServed: nonEmptyString.optional(),
    itemListTitle: nonEmptyString.optional(),
    itemList: z.array(STRUCTURED_LIST_ENTRY_SCHEMA).optional(),
    labels: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type GuideContent = z.infer<typeof GUIDE_CONTENT_SCHEMA>;

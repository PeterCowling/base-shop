import { z } from "zod";

/**
 * Strict Zod schema for guide content validation.
 *
 * Required fields:
 * - seo.title (non-empty string)
 * - seo.description (non-empty string)
 *
 * Optional but validated when present:
 * - intro (must have both title and body)
 * - sections (array, each item must have id and title)
 * - faqs (array, each item must have q and a)
 * - callouts (record, values must be non-empty strings)
 *
 * All other fields are allowed via passthrough for flexibility.
 */

const guideSeoSchema = z.object({
  title: z.string().trim().min(1, "seo.title is required and must not be empty"),
  description: z.string().trim().min(1, "seo.description is required and must not be empty"),
});

// Intro can be: object {title, body}, array of strings, or single string
const guideIntroSchema = z.union([
  // Object format: {title, body}
  z.object({
    title: z.string().trim().min(1, "intro.title is required when intro is object format"),
    body: z.union([
      z.string().trim().min(1),
      z.array(z.string().trim().min(1)),
    ]),
  }),
  // Array format: ["paragraph 1", "paragraph 2"]
  z.array(z.string().trim().min(1)),
  // String format: "single paragraph"
  z.string().trim().min(1),
]);

const guideSectionImageSchema = z.object({
  src: z.string().trim().min(1, "section.images[].src is required"),
  alt: z.string().trim().min(1, "section.images[].alt is required"),
  caption: z.string().trim().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const guideSectionSchema = z.object({
  id: z.string().trim().min(1, "section.id is required"),
  title: z.string().trim().min(1, "section.title is required"),
  body: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional(),
  list: z.array(z.string()).optional(),
  images: z.array(guideSectionImageSchema).optional(),
});

const guideGalleryItemSchema = z.object({
  src: z.string().trim().min(1, "gallery.items[].src is required"),
  alt: z.string().trim().min(1, "gallery.items[].alt is required"),
  caption: z.string().trim().min(1).optional(),
  aspectRatio: z.string().trim().min(1).optional(),
  preset: z.string().trim().min(1).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const guideGallerySchema = z.object({
  heading: z.string().trim().min(1).optional(),
  items: z.array(guideGalleryItemSchema).min(1, "gallery.items must not be empty"),
});

const guideFaqAnswerSchema = z.union([
  z.string().trim().min(1),
  z.array(z.string().trim().min(1)),
], {
  errorMap: () => ({ message: "faq.a (answer) is required" }),
});

const guideFaqSchema = z.union([
  z.object({
    q: z.string().trim().min(1, "faq.q (question) is required"),
    a: guideFaqAnswerSchema,
  }),
  z.object({
    question: z.string().trim().min(1, "faq.question is required"),
    answer: guideFaqAnswerSchema,
  }),
]);

const guideCalloutsSchema = z.record(
  z.string().trim().min(1, "callout values must be non-empty strings")
);

export const guideContentSchema = z
  .object({
    seo: guideSeoSchema,
    linkLabel: z.string().trim().min(1).optional(),
    lastUpdated: z
      .union([z.string().datetime(), z.string().date()])
      .optional(), // ISO 8601 date or datetime, auto-updated on save
    intro: guideIntroSchema.optional(),
    galleries: z.array(guideGallerySchema).optional(),
    sections: z.array(guideSectionSchema).optional(),
    faqs: z.array(guideFaqSchema).optional(),
    callouts: guideCalloutsSchema.optional(),
    // Legacy/deprecated fields (allow but don't validate structure)
    tips: z.array(z.unknown()).optional(),
    warnings: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type GuideContentInput = z.infer<typeof guideContentSchema>;

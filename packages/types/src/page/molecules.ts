import { z } from "zod";
import { baseComponentSchema, type PageComponentBase } from "./base";

export interface AnnouncementBarComponent extends PageComponentBase {
  type: "AnnouncementBar";
  text?: string;
  link?: string;
  closable?: boolean;
}

export const announcementBarComponentSchema = baseComponentSchema.extend({
  type: z.literal("AnnouncementBar"),
  text: z.string().optional(),
  link: z.string().optional(),
  closable: z.boolean().optional(),
});

export interface ValuePropsComponent extends PageComponentBase {
  type: "ValueProps";
  items?: { icon: string; title: string; desc: string }[];
}

export const valuePropsComponentSchema = baseComponentSchema.extend({
  type: z.literal("ValueProps"),
  items: z
    .array(z.object({ icon: z.string(), title: z.string(), desc: z.string() }))
    .optional(),
});

export interface ReviewsCarouselComponent extends PageComponentBase {
  type: "ReviewsCarousel";
  reviews?: { nameKey: string; quoteKey: string }[];
}

export const reviewsCarouselComponentSchema = baseComponentSchema.extend({
  type: z.literal("ReviewsCarousel"),
  reviews: z
    .array(z.object({ nameKey: z.string(), quoteKey: z.string() }))
    .optional(),
});

export interface ContactFormComponent extends PageComponentBase {
  type: "ContactForm";
  action?: string;
  method?: string;
}

export const contactFormComponentSchema = baseComponentSchema.extend({
  type: z.literal("ContactForm"),
  action: z.string().optional(),
  method: z.string().optional(),
});

export interface NewsletterSignupComponent extends PageComponentBase {
  type: "NewsletterSignup";
  text?: string;
  action?: string;
  placeholder?: string;
  submitLabel?: string;
}

export const newsletterSignupComponentSchema = baseComponentSchema.extend({
  type: z.literal("NewsletterSignup"),
  text: z.string().optional(),
  action: z.string().optional(),
  placeholder: z.string().optional(),
  submitLabel: z.string().optional(),
});

export interface SearchBarComponent extends PageComponentBase {
  type: "SearchBar";
  placeholder?: string;
  limit?: number;
}

export const searchBarComponentSchema = baseComponentSchema.extend({
  type: z.literal("SearchBar"),
  placeholder: z.string().optional(),
  limit: z.number().optional(),
});

export interface MapBlockComponent extends PageComponentBase {
  type: "MapBlock";
  lat?: number;
  lng?: number;
  zoom?: number;
}

export const mapBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("MapBlock"),
  lat: z.number().optional(),
  lng: z.number().optional(),
  zoom: z.number().optional(),
});

export interface VideoBlockComponent extends PageComponentBase {
  type: "VideoBlock";
  src?: string;
  autoplay?: boolean;
}

export const videoBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("VideoBlock"),
  src: z.string().optional(),
  autoplay: z.boolean().optional(),
});

export interface FAQBlockComponent extends PageComponentBase {
  type: "FAQBlock";
  items?: { question: string; answer: string }[];
}

export const faqBlockComponentSchema = baseComponentSchema.extend({
  type: z.literal("FAQBlock"),
  items: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .optional(),
});

export interface CountdownTimerComponent extends PageComponentBase {
  type: "CountdownTimer";
  targetDate?: string;
  timezone?: string;
  completionText?: string;
  styles?: string;
}

export const countdownTimerComponentSchema = baseComponentSchema.extend({
  type: z.literal("CountdownTimer"),
  targetDate: z.string().optional(),
  timezone: z.string().optional(),
  completionText: z.string().optional(),
  styles: z.string().optional(),
});

export interface SocialLinksComponent extends PageComponentBase {
  type: "SocialLinks";
  facebook?: string;
  instagram?: string;
  x?: string;
  youtube?: string;
  linkedin?: string;
}

export const socialLinksComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialLinks"),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  x: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional(),
});

export interface SocialFeedComponent extends PageComponentBase {
  type: "SocialFeed";
  platform?: "twitter" | "instagram";
  account?: string;
  hashtag?: string;
}

export const socialFeedComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialFeed"),
  platform: z.enum(["twitter", "instagram"]).optional(),
  account: z.string().optional(),
  hashtag: z.string().optional(),
});

export interface SocialProofComponent extends PageComponentBase {
  type: "SocialProof";
  source?: string;
  frequency?: number;
}

export const socialProofComponentSchema = baseComponentSchema.extend({
  type: z.literal("SocialProof"),
  source: z.string().optional(),
  frequency: z.number().optional(),
});


import { type HELP_ARTICLE_KEYS } from "@/components/assistance/HelpCentreNav";

export type HelpArticleKey = (typeof HELP_ARTICLE_KEYS)[number];

export type AssistanceTranslator = (key: string, options?: Record<string, unknown>) => string;
export type HowToTranslator = (key: string, options?: Record<string, unknown>) => string;
export type ExperiencesTranslator = (key: string, options?: Record<string, unknown>) => string;

export type GuideCollectionCopy = {
  heading: string;
  description: string;
  taggedHeading?: string;
  taggedDescription?: string;
  emptyMessage?: string;
  clearFilterLabel: string;
  cardCta: string;
};

export const OG_IMAGE_DIMENSIONS = {
  width: 1200,
  height: 630,
} as const;

export const OG_META = {
  description: "og:description",
  locale: "og:locale",
  image: "og:image",
  imageWidth: "og:image:width",
  imageHeight: "og:image:height",
  localeAlternate: "og:locale:alternate",
} as const;

export const TWITTER_META = {
  card: "twitter:card",
  image: "twitter:image",
  title: "twitter:title",
  description: "twitter:description",
} as const;

export const TWITTER_CARD_TYPE = "summary_large_image" as const;

export const PLANNING_GUIDES_SECTION_ID = "planning-guides" as const;

export const ASSISTANCE_HUB_TEST_IDS = {
  section: "assistance-hubs",
  howToLink: "assistance-hub-how-to",
  experiencesLink: "assistance-hub-experiences",
} as const;

export const DEFAULT_ARTICLE_KEY: HelpArticleKey = "bookingBasics";

import type { GuideKey } from "@/routes.guides-helpers";

export type FallbackListItem = {
  title?: string;
  description?: string;
  link?: {
    guideKey: GuideKey;
  };
};

export type FallbackContent = {
  intro?: unknown;
  toc?: unknown;
  classics?: { heading?: unknown; items?: unknown };
  alternatives?: { heading?: unknown; items?: unknown };
  sunset?: { heading?: unknown; paragraphs?: unknown };
  etiquette?: { heading?: unknown; items?: unknown };
  faqs?: { heading?: unknown; items?: unknown };
  drone?: { summary?: unknown; body?: unknown };
  galleryAlt?: unknown;
  galleryFallbackAlt?: unknown;
};

export interface FallbackData {
  intro: string[];
  toc: { href: string; label: string }[];
  gallery: { src: string; alt: string }[];
  classics: { heading: string; items: FallbackListItem[] } | null;
  alternatives: { heading: string; items: FallbackListItem[] } | null;
  sunset: { heading: string; paragraphs: string[] } | null;
  etiquette: { heading: string; items: string[] } | null;
  faqs: { heading: string; items: { summary: string; body: string }[] } | null;
  drone: { summary?: string; body?: string } | null;
  hasContent: boolean;
}

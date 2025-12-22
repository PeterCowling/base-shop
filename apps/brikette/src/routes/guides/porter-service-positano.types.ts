import type { GuideKey } from "@/routes.guides-helpers";

export type GuideSection = { id: string; title: string; body: string[] };
export type GuideFaq = { q: string; a: string[] };
export type TocEntry = { href: string; label: string };
export type ResourceLink = { label: string; href: string };

export type GuideExtras = {
  introTitle: string;
  intro: string[];
  sections: GuideSection[];
  steps: string[];
  howTitle: string;
  resources: string[];
  resourcesTitle: string;
  resourceLinks: ResourceLink[];
  etiquette: string[];
  etiquetteTitle: string;
  faqs: GuideFaq[];
  faqsTitle: string;
  galleryTitle: string;
  galleryItems: { src: string; alt: string; caption?: string }[];
  tocItems: TocEntry[];
  tocTitle: string;
  heroImage: { src: string; alt: string; width?: number; height?: number };
};

export const PORTER_GUIDE_KEY = "porterServices" satisfies GuideKey;
export type PorterGuideKey = typeof PORTER_GUIDE_KEY;

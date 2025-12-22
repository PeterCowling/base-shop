import type { GuideLabelKey } from "./i18n";

export type GuideSection = { id: string; title: string; body: string[] };
export type GuideFaq = { q: string; a: string[] };
export type TocEntry = { href: string; label: string };
export type GuideImage = { src: string; alt: string; caption?: string };

export type GuideExtras = {
  intro: string[];
  image?: GuideImage;
  sections: GuideSection[];
  beforeList: string[];
  stepsList: string[];
  stepsMapEmbedUrl?: string;
  kneesList: string[];
  kneesDockPrefix?: string;
  kneesDockLinkText?: string;
  kneesPorterPrefix?: string;
  kneesPorterLinkText?: string;
  faqs: GuideFaq[];
  faqsTitle: string;
  tocTitle: string;
  tocItems: TocEntry[];
  howToSteps: string[];
  labels: Record<GuideLabelKey, string>;
};

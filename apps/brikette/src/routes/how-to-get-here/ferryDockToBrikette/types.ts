import type { GuideLabelKey } from "./i18n";

export type GuideSection = { id: string; title: string; body: string[] };
export type GuideFaq = { q: string; a: string[] };
export type TocEntry = { href: string; label: string };

export type GuideExtras = {
  intro: string[];
  sections: GuideSection[];
  tocItems: TocEntry[];
  tocTitle: string;
  beforeList: string[];
  stepsList: string[];
  kneesList: string[];
  kneesDockPrefix?: string;
  kneesDockLinkText?: string;
  kneesPorterPrefix?: string;
  kneesPorterLinkText?: string;
  faqs: GuideFaq[];
  faqsTitle: string;
  howToSteps: string[];
  labels: Record<GuideLabelKey, string>;
};

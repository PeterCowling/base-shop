// src/routes/guides/laundry-positano/types.ts
export type GuideSection = { id: string; title: string; body: string[] };

export type GuideFaq = { q: string; a: string[] };

export type GuideExtras = {
  intro: string[];
  sections: GuideSection[];
  howToSteps: string[];
  howToStepsUsedFallback: boolean;
  tips: string[];
  faqs: GuideFaq[];
  galleryItems: { src: string; alt: string; caption?: string }[];
  tocItems: { href: string; label: string }[];
  tocTitle: string;
  howToTitle: string;
  tipsTitle: string;
  faqsTitle: string;
};

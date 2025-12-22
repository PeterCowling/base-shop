export type Section = { id: string; title: string; body: string[] };

export type TocItem = { href: string; label: string };

export type FaqItem = { q: string; a: string[] };

export interface GuideExtras {
  intro: string[];
  sections: Section[];
  tocTitle?: string;
  tocItems: TocItem[];
  atAGlanceLabel: string;
  costItems: { label: string; low: number; mid: number; high: number }[];
  costTitle: string;
  tipsTitle?: string;
  tips: string[];
  faqsTitle?: string;
  faqs: FaqItem[];
  // Not used for this guide; accessed in tests to ensure omission
  transport?: unknown;
  hasStructured: boolean;
}

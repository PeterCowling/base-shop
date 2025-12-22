// src/routes/guides/positano-on-a-backpacker-budget/types.ts
import type { GuideKey } from "@/routes.guides-helpers";

export type TocItem = { href: string; label: string };

export type TransportCompareLink = { key: GuideKey; label?: string };

export type FaqItem = { q: string; a: string[] };

export interface DaySection {
  id: string;
  title: string;
  items: string[];
}

export interface GuideExtras {
  hasStructured: boolean;
  intro: string[];
  toc: TocItem[];
  days: DaySection[];
  savings: { title: string; items: string[] };
  food: { title: string; text?: string };
  transport: {
    title: string;
    compareLabel: string;
    compareLinks: TransportCompareLink[];
    ferryPrefix: string;
    ferryLinkLabel: string;
    ferrySuffix: string;
  } | null;
  faqs: FaqItem[];
  faqsTitle?: string;
}

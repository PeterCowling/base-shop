export type FormattingToken = "em" | "strong";

export type LinkComponentToken =
  | "linkBestTime"
  | "linkHowTo"
  | "linkNaples"
  | "linkSalerno"
  | "linkFerries"
  | "linkBeaches"
  | "linkPath"
  | "linkCapri"
  | "linkAmalfi"
  | "linkRavello"
  | "linkCheapEats"
  | "linkBudgetArrival";

export type ComponentToken = FormattingToken | LinkComponentToken;

export type FallbackBlock = {
  i18nKey: string;
  defaultValue: string;
  componentTokens?: ComponentToken[];
};

export type FallbackSection = {
  id: string;
  title: string;
  paragraphs?: FallbackBlock[];
  listItems?: FallbackBlock[];
};

export type FallbackGalleryItem = { src: string; alt: string; caption: string };

export interface FallbackFaq {
  question: string;
  questionKey: string;
  answerKey: string;
  defaultAnswer: string;
  componentTokens?: ComponentToken[];
}

export interface FallbackData {
  intro: string[];
  tocItems: { href: string; label: string }[];
  galleryItems: FallbackGalleryItem[];
  sections: FallbackSection[];
  costSection: {
    atAGlanceLabel: string;
  };
  tipsTitle?: string;
  tips: string[];
  faqsTitle?: string;
  faqs: FallbackFaq[];
  faqId: string;
  hasFallbackContent: boolean;
}

export type SectionRecord = Record<string, unknown>;

export type FallbackContentRecord = {
  intro?: unknown;
  sections?: unknown;
  gallery?: unknown;
  tips?: unknown;
  tipsTitle?: unknown;
  faqs?: unknown;
  faqHeading?: unknown;
  atAGlanceLabel?: unknown;
};

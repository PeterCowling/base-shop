/* src/routes/experiences/types.ts */
import type { GuideMeta } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import type { NormalizedFaqEntry } from "@/utils/buildFaqJsonLd";

export type SectionKey = "bar" | "hikes" | "concierge";

export type SectionMediaEntry = {
  image: string;
};

export type SectionContent = {
  key: SectionKey;
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  imageAlt: string;
  imageSrc: string;
  imageRaw: string;
};

export type HeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  supporting: string;
  primaryCta: string;
  secondaryCta: string;
  breakfastCta: string;
  tertiaryCta: string;
  primaryCtaAria: string;
  secondaryCtaAria: string;
  breakfastCtaAria: string;
  tertiaryCtaAria: string;
};

export type HeroCta = {
  label: string;
  aria: string;
  to: string;
};

export type GuideCollectionCopy = {
  heading: string;
  description: string;
  taggedHeading?: string;
  taggedDescription?: string;
  emptyMessage?: string;
  clearFilterLabel: string;
  cardCta: string;
  directionsLabel?: string;
  filterHeading?: string;
  filterDescription?: string;
};

export type GuideCollectionGroup = {
  id: string;
  guides: readonly GuideMeta[];
  copy: GuideCollectionCopy;
  showFilters?: boolean;
};

export type CtaContent = {
  title: string;
  subtitle: string;
  buttons: {
    book: string;
    events: string;
    breakfast: string;
    concierge: string;
  };
};

export type CtaLink = {
  label: string;
  to: string;
};

export type ExperiencesMetaData = {
  title: string;
  desc: string;
  lang: AppLanguage;
  supportedLngs: readonly AppLanguage[];
  faqJson: string;
};

export type ExperiencesPageViewModel = {
  meta: ExperiencesMetaData;
  hero: HeroContent;
  heroCtas: HeroCta[];
  sections: SectionContent[];
  experienceGuides: readonly GuideMeta[];
  groupedGuideCollections?: readonly GuideCollectionGroup[];
  guideCollectionCopy: GuideCollectionCopy;
  guideCollectionId: string;
  clearFilterHref: string;
  filterParam: "topic" | "tag";
  filterTag: string | null;
  filterTopic: string | null;
  faqTitle: string;
  faqEntries: NormalizedFaqEntry[];
  cta: CtaContent;
  ctaLinks: {
    book: CtaLink;
    events: CtaLink;
    breakfast: CtaLink;
    concierge: CtaLink;
  };
};

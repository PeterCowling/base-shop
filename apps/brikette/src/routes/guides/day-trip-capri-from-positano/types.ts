// src/routes/guides/day-trip-capri-from-positano/types.ts
export interface TocEntry {
  href: string;
  label: string;
}

export interface FallbackSection {
  id: string;
  title: string;
  body: string[];
  list: string[];
}

export interface GuideFaq {
  q: string;
  a: string[];
}

export interface GalleryItem {
  src: string;
  alt: string;
  caption: string;
}

export interface GuideExtras {
  hasGeneric: boolean;
  showTranslatedToc: boolean;
  translatedToc: TocEntry[];
  fallbackToc: TocEntry[];
  fallbackIntro: string[];
  fallbackSections: FallbackSection[];
  fallbackFaqsTitle: string;
  fallbackFaqs: GuideFaq[];
  galleryTitle: string;
  galleryItems: GalleryItem[];
  howToSteps: { name: string; text?: string }[];
}

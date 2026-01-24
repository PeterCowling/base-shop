export type FallbackTranslator = (key: string, options?: unknown) => unknown;

export type StructuredSection = { id: string; title: string; body: string[] };

export type StructuredFallback = {
  translator: FallbackTranslator;
  intro: string[];
  sections: StructuredSection[];
  source?: "guidesFallback" | "guidesEn";
};

export type SectionLike = { id?: unknown; title?: unknown; body?: unknown; items?: unknown };

export type I18nLike = {
  getFixedT?: (lng: string, ns: string) => unknown;
  __tGuidesFallback?: FallbackTranslator;
};

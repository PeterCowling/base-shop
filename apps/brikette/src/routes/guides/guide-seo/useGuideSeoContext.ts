import { useMemo } from "react";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";

import type { GuideSeoTemplateContext, TocItem } from "./types";

interface UseGuideSeoContextArgs {
  baseToc: TocItem[];
  canonicalUrl: string;
  contentTranslator: GenericContentTranslator;
  description: string;
  faqs: GuideSeoTemplateContext["faqs"];
  guideKey: GuideSeoTemplateContext["guideKey"];
  hasLocalizedContent: boolean;
  intro: string[];
  lang: GuideSeoTemplateContext["lang"];
  metaKey: GuideSeoTemplateContext["metaKey"];
  ogImage: GuideSeoTemplateContext["ogImage"];
  sections: GuideSeoTemplateContext["sections"];
  title: string;
  translateGuides: GuideSeoTemplateContext["translateGuides"];
  translateGuidesEn?: GuideSeoTemplateContext["translateGuidesEn"];
  buildTocItems?: (context: GuideSeoTemplateContext) => TocItem[] | null | undefined;
}

interface UseGuideSeoContextResult {
  context: GuideSeoTemplateContext;
}

export function useGuideSeoContext({
  baseToc,
  canonicalUrl,
  contentTranslator,
  description,
  faqs,
  guideKey,
  hasLocalizedContent,
  intro,
  lang,
  metaKey,
  ogImage,
  sections,
  title,
  translateGuides,
  translateGuidesEn,
  buildTocItems,
}: UseGuideSeoContextArgs): UseGuideSeoContextResult {
  const contextInput = useMemo<GuideSeoTemplateContext>(() => {
    return {
      lang,
      guideKey,
      metaKey,
      hasLocalizedContent,
      translator: contentTranslator,
      translateGuides,
      ...(typeof translateGuidesEn === "function" ? { translateGuidesEn } : {}),
      sections,
      intro,
      faqs,
      toc: baseToc,
      ogImage,
      article: { title, description },
      canonicalUrl,
    } satisfies GuideSeoTemplateContext;
  }, [
    baseToc,
    canonicalUrl,
    contentTranslator,
    description,
    faqs,
    guideKey,
    hasLocalizedContent,
    intro,
    lang,
    metaKey,
    ogImage,
    sections,
    title,
    translateGuides,
    translateGuidesEn,
  ]);

  const toc = useMemo(() => {
    if (typeof buildTocItems === "function") {
      const custom = buildTocItems(contextInput);
      if (Array.isArray(custom)) {
        return custom;
      }
      if (custom) {
        return [];
      }
    }
    return baseToc;
  }, [baseToc, buildTocItems, contextInput]);

  const context = useMemo<GuideSeoTemplateContext>(() => ({
    ...contextInput,
    toc,
  }), [contextInput, toc]);

  return { context };
}

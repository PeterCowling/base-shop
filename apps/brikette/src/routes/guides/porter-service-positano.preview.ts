import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { computePorterGuideExtras } from "./porter-service-positano.extras";
import { GUIDE_KEY, OG_IMAGE } from "./porter-service-positano.constants";
import type { GuideExtras } from "./porter-service-positano.types";
import type { AppLanguage } from "@/i18n.config";
import type { TFunction } from "i18next";

interface PreviewContextParams {
  lang: AppLanguage;
  translateGuides: GuideSeoTemplateContext["translateGuides"];
}

interface InitialExtrasParams {
  fallbackGuides: TFunction<"guides">;
  fallbackLocal: TFunction<"guidesFallback">;
  fallbackEn: TFunction<"guidesFallback">;
}

export function createPreviewContext({
  lang,
  translateGuides,
}: PreviewContextParams): GuideSeoTemplateContext {
  return {
    lang,
    guideKey: GUIDE_KEY,
    metaKey: GUIDE_KEY,
    hasLocalizedContent: true,
    translator: translateGuides as GuideSeoTemplateContext["translator"],
    translateGuides,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "", width: OG_IMAGE.width, height: OG_IMAGE.height },
    article: { title: "", description: "" },
    canonicalUrl: "",
  };
}

export function createInitialExtras(
  previewContext: GuideSeoTemplateContext,
  { fallbackGuides, fallbackLocal, fallbackEn }: InitialExtrasParams,
): GuideExtras {
  return computePorterGuideExtras(previewContext, {
    fallbackGuides,
    fallbackLocal,
    fallbackEn,
  });
}

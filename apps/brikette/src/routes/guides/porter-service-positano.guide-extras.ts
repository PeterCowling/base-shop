import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";
import { computePorterGuideExtras } from "./porter-service-positano.extras";
import type { GuideExtras } from "./porter-service-positano.types";
import { getGuidesFallbackTranslator } from "./porter-service-positano.translators";
import type { TFunction } from "i18next";

interface GuideExtrasBuilderParams {
  previewContext: GuideSeoTemplateContext;
  initialExtras: GuideExtras;
  fallbackGuides: TFunction<"guides">;
  fallbackEn: TFunction<"guidesFallback">;
}

type GuideExtrasBuilder = (context: GuideSeoTemplateContext) => GuideExtras;

export function createGuideExtrasBuilder({
  previewContext,
  initialExtras,
  fallbackGuides,
  fallbackEn,
}: GuideExtrasBuilderParams): GuideExtrasBuilder {
  return (context) => {
    if (
      context.lang === previewContext.lang &&
      context.sections.length === 0 &&
      context.intro.length === 0 &&
      context.faqs.length === 0 &&
      context.toc.length === 0
    ) {
      return initialExtras;
    }

    return computePorterGuideExtras(context, {
      fallbackGuides,
      fallbackLocal: getGuidesFallbackTranslator(context.lang),
      fallbackEn,
    });
  };
}

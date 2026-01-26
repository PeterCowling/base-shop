import { memo } from "react";

import type { GenericContentTranslator } from "@/components/guides/GenericContent";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import { renderArticleLead } from "./articleLead";
import { GUIDE_KEY } from "./constants";
import { createGuideExtras } from "./guideExtras";
import type { GuideExtras } from "./types";

function createTranslateGuides(
  lang: AppLanguage,
): {
  translateGuides: GenericContentTranslator;
  translator: GenericContentTranslator;
  hasLocalizedContent: boolean;
} {
  const primary = appI18n.getFixedT(lang, "guides") as GenericContentTranslator;
  const fallback = appI18n.getFixedT("en", "guides") as GenericContentTranslator;

  const introRaw = primary(`content.${GUIDE_KEY}.intro`, { returnObjects: true });
  const sectionsRaw = primary(`content.${GUIDE_KEY}.sections`, { returnObjects: true });
  const faqsRaw = primary(`content.${GUIDE_KEY}.faqs`, { returnObjects: true });
  const hasLocalizedContent =
    ensureStringArray(introRaw).length > 0 ||
    ensureArray(sectionsRaw).length > 0 ||
    ensureArray(faqsRaw).length > 0;

  const translator = (hasLocalizedContent ? primary : fallback) as GenericContentTranslator;

  const translateGuides = ((...args: Parameters<GenericContentTranslator>) => {
    const [rawKey] = args;
    const key = typeof rawKey === "string" ? rawKey : undefined;
    const value: unknown = primary(...args);
    const getFallback = () => fallback(...args);

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length === 0 || (key && trimmed === key)) {
        return getFallback();
      }
      return value;
    }

    if (Array.isArray(value)) {
      return value.length > 0 ? value : getFallback();
    }

    if (value == null) {
      return getFallback();
    }

    return value;
  }) as GenericContentTranslator;

  return { translateGuides, translator, hasLocalizedContent };
}

function buildGuideContext(lang: AppLanguage): GuideSeoTemplateContext {
  const { translateGuides, translator, hasLocalizedContent } = createTranslateGuides(lang);

  return {
    lang,
    guideKey: GUIDE_KEY,
    metaKey: GUIDE_KEY,
    hasLocalizedContent,
    translator,
    translateGuides,
    sections: [],
    intro: [],
    faqs: [],
    toc: [],
    ogImage: { url: "", width: 0, height: 0 },
    article: { title: "", description: "" },
    canonicalUrl: "",
  } satisfies GuideSeoTemplateContext;
}

function buildGuideExtras(lang: AppLanguage): { context: GuideSeoTemplateContext; extras: GuideExtras } {
  const context = buildGuideContext(lang);
  const extras = createGuideExtras(context);
  return { context, extras };
}

function resolveMetaString(
  translator: GenericContentTranslator,
  key: string,
  fallback?: string,
): string | undefined {
  const raw = translator(key);
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.length > 0 && trimmed !== key) {
      return trimmed;
    }
  }
  if (fallback && fallback.trim().length > 0 && fallback !== key) {
    return fallback.trim();
  }
  return undefined;
}

export type ChiesaNuovaArrivalDropInProps = {
  lang: AppLanguage;
};

function ChiesaNuovaArrivalDropIn({ lang }: ChiesaNuovaArrivalDropInProps): JSX.Element | null {
  const { context, extras } = buildGuideExtras(lang);
  const translateGuides = context.translateGuides;
  const fallbackGuides = appI18n.getFixedT("en", "guides") as GenericContentTranslator;

  const titleKey = `content.${GUIDE_KEY}.seo.title`;
  const descriptionKey = `content.${GUIDE_KEY}.seo.description`;

  const fallbackHeading = resolveMetaString(fallbackGuides, titleKey);
  const heading = resolveMetaString(translateGuides, titleKey, fallbackHeading);

  const fallbackDescription = fallbackGuides(descriptionKey) as string;
  const description = resolveMetaString(
    translateGuides,
    descriptionKey,
    fallbackDescription,
  );

  const extrasWithoutToc = { ...extras, tocItems: [] } satisfies GuideExtras;

  if (!heading) {
    return null;
  }

  return (
    <section className="space-y-6 rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/80">
      <header className="space-y-3">
        <h2 className="text-3xl font-semibold text-brand-heading dark:text-brand-text">{heading}</h2>
        {description ? (
          <p className="text-base leading-relaxed text-brand-text/80 dark:text-brand-text/80">{description}</p>
        ) : null}
      </header>
      <div className="space-y-10">
        {renderArticleLead(context, extrasWithoutToc)}
      </div>
    </section>
  );
}

export default memo(ChiesaNuovaArrivalDropIn);

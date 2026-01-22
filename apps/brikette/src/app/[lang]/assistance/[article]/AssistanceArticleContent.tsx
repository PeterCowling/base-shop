"use client";

// src/app/[lang]/assistance/[article]/AssistanceArticleContent.tsx
// Client component for assistance article pages
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import { Section } from "@acme/ui/atoms";
import ArticleSection from "@acme/ui/organisms/AssistanceArticleSection";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { HelpArticleKey } from "@/routes.assistance-helpers";
import { guideSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

type Props = {
  lang: AppLanguage;
  articleKey: HelpArticleKey;
  namespace: string;
};

function AssistanceArticleContent({ lang, articleKey, namespace }: Props) {
  const { t: tNamespace, ready } = useTranslation(namespace, { lng: lang });
  const { t: tGuides } = useTranslation("guides", { lng: lang });
  const guidesEnT = useMemo<TFunction>(() => i18n.getFixedT("en", "guides") as TFunction, []);

  const resolveGuideLabel = (key: string): string => {
    const current = tGuides(key, { defaultValue: key }) as unknown;
    const currentText = typeof current === "string" ? current.trim() : "";
    if (currentText && currentText !== key) return currentText;
    const fallback = guidesEnT(key, { defaultValue: key }) as unknown;
    const fallbackText = typeof fallback === "string" ? fallback.trim() : "";
    return fallbackText && fallbackText !== key ? fallbackText : key;
  };

  return (
    <>
      <ArticleSection lang={lang} namespace={namespace} />

      <Section padding="none" className="mx-auto mt-10 max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-3 text-lg font-semibold tracking-tight text-brand-heading dark:text-brand-surface">
          {resolveGuideLabel("labels.alsoSee")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li>
            <Link
              href={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "backpackerItineraries")}`}
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {resolveGuideLabel("content.backpackerItineraries.linkLabel")}
            </Link>
          </li>
          <li>
            <Link
              href={`/${lang}/${getSlug("guides", lang)}/${guideSlug(lang, "onlyHostel")}`}
              className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
            >
              {resolveGuideLabel("content.onlyHostel.linkLabel")}
            </Link>
          </li>
        </ul>
      </Section>
    </>
  );
}

export default memo(AssistanceArticleContent);

// src/components/guides/GuideCollectionList.tsx
import clsx from "clsx";

import type { AppLanguage } from "@/i18n.config";
import type { GuideMeta } from "@/data/guides.index";
import type { TFunction } from "i18next";

import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import type { GuideCollectionCopy, GuideSummaryResolver } from "./GuideCollection.types";
import { GuideCollectionCard } from "./GuideCollectionCard";
import { formatGuideCardCta } from "./formatGuideCardCta";

const GRID_CLASSES = ["mt-6", "grid", "gap-4", "sm:grid-cols-2"] as const;

type Translator = TFunction;

interface GuideCollectionListProps {
  lang: AppLanguage;
  guides: readonly GuideMeta[];
  translate: Translator;
  fallbackTranslate: Translator;
  copy: GuideCollectionCopy;
  resolveSummary: GuideSummaryResolver;
  // When false, do not fall back to any translated label; use the raw guide key
  allowEnglishFallback?: boolean;
}

export const GuideCollectionList = ({
  lang,
  guides,
  translate,
  fallbackTranslate,
  copy,
  resolveSummary,
  allowEnglishFallback = true,
}: GuideCollectionListProps): JSX.Element => (
  <ul className={clsx(GRID_CLASSES)}>
    {guides.map((guide) => {
      const label = allowEnglishFallback
        ? getGuideLinkLabel(translate, fallbackTranslate, guide.key)
        : guide.key;

      const summary = resolveSummary(guide.key);
      const ctaLabel = copy.cardCta ? formatGuideCardCta(copy.cardCta, label) : undefined;

      return (
        <li key={guide.key}>
          <GuideCollectionCard
            lang={lang}
            guide={guide}
            label={label}
            {...(summary !== undefined ? { summary } : {})}
            {...(ctaLabel !== undefined ? { ctaLabel } : {})}
          />
        </li>
      );
    })}
  </ul>
);

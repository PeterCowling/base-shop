// src/components/guides/GuideCollectionList.tsx
import clsx from "clsx";
import type { TFunction } from "i18next";

import type { GuideMeta } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

import { formatGuideCardCta } from "./formatGuideCardCta";
import type { GuideCollectionCopy, GuideSummaryResolver } from "./GuideCollection.types";
import { GuideCollectionCard } from "./GuideCollectionCard";

const GRID_CLASSES = ["mt-6", "grid", "gap-4", "sm:grid-cols-2"] as const;

type Translator = TFunction;

const KEEP_ARROW_TOGETHER = /\s*→\s*/g;
function formatGuideTitleForCta(title: string): string {
  // Prevent orphaned arrows in narrow CTA buttons.
  return title.replace(KEEP_ARROW_TOGETHER, "\u00A0→\u00A0");
}

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
      const ctaLabel = copy.cardCta
        ? formatGuideCardCta(copy.cardCta, formatGuideTitleForCta(label))
        : undefined;
      const directionsLabel = copy.directionsLabel;

      return (
        <li key={guide.key}>
          <GuideCollectionCard
            lang={lang}
            guide={guide}
            label={label}
            {...(summary !== undefined ? { summary } : {})}
            {...(ctaLabel !== undefined ? { ctaLabel } : {})}
            {...(directionsLabel ? { directionsLabel } : {})}
          />
        </li>
      );
    })}
  </ul>
);

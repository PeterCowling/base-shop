// src/components/guides/RelatedGuides.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import * as Guides from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

const BASE_SECTION_CLASS = [
  "mx-auto",
  "max-w-4xl",
  "px-4",
  "sm:px-6",
  "lg:px-8",
] as const;

const BASE_LIST_CLASS = ["grid", "gap-3", "sm:grid-cols-2", "lg:grid-cols-3"] as const;
const LIST_LAYOUT_CLASS_TOKENS = {
  default: BASE_LIST_CLASS,
  twoColumn: ["grid", "gap-3", "sm:grid-cols-2"] as const,
} as const;

type RelatedGuidesLayout = keyof typeof LIST_LAYOUT_CLASS_TOKENS;

export interface RelatedItem {
  readonly key: GuideKey; // key under guides.links and route mapping
}

interface Props {
  items: readonly RelatedItem[];
  titleKey?: string; // default "labels.relatedGuides"
  title?: string;
  lang?: AppLanguage;
  className?: string;
  listClassName?: string;
  listLayout?: RelatedGuidesLayout;
}

function RelatedGuides({
  items,
  title,
  titleKey = "labels.relatedGuides",
  lang: explicitLang,
  className,
  listClassName,
  listLayout = "default",
}: Props): JSX.Element {
  const fallbackLang = useCurrentLanguage();
  const lang = explicitLang ?? fallbackLang;
  const translation = useTranslation("guides", { lng: lang });
  const t = (translation?.t ?? ((key: string) => key)) as TFunction;
  const fallbackGuides = (translation?.i18n?.getFixedT?.("en", "guides") ?? ((key: string) => key)) as TFunction;

  const resolvedSectionClass = className ?? "mt-10";
  const sectionClassName = [...BASE_SECTION_CLASS, resolvedSectionClass].filter(Boolean).join(" ");
  const layoutTokens = LIST_LAYOUT_CLASS_TOKENS[listLayout] ?? LIST_LAYOUT_CLASS_TOKENS.default;
  const listClassNameValue = listClassName ?? layoutTokens.join(" ");

  return (
    <section className={sectionClassName}>
      <h2 className="mb-3 text-lg font-semibold tracking-tight text-brand-heading dark:text-brand-heading">
        {title ?? t(titleKey)}
      </h2>
      <ul className={listClassNameValue}>
        {items.map(({ key }) => {
          const resolvedLabel = getGuideLinkLabel(t, fallbackGuides, key);
          const ariaLabel = resolvedLabel.replace(/→/g, "to");
          const computedSlug =
            typeof Guides.guideSlug === "function"
              ? Guides.guideSlug(lang, key)
              : key.replace(/([a-z\d])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();
          // Prefer canonical helper when available to respect namespace routing.
          const fallbackBase =
            typeof Guides.guideNamespace === "function"
              ? Guides.guideNamespace(lang, key).baseSlug
              : getSlug("experiences", lang);
          const computedHref =
            typeof Guides.guideHref === "function"
              ? Guides.guideHref(lang, key)
              : `/${lang}/${fallbackBase}/${computedSlug}`;
          return (
            <li key={computedSlug}>
              <Link
                href={computedHref}
                className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary underline-offset-4 hover:underline dark:bg-brand-text dark:text-brand-secondary"
                aria-label={ariaLabel}
              >
                {resolvedLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default memo(RelatedGuides);

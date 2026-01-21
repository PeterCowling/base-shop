"use client";

// src/app/[lang]/experiences/ExperiencesPageContent.tsx
// Client component for experiences listing page
import { Fragment, memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "next/navigation";
import type { TFunction } from "i18next";

import ExperiencesStructuredData from "@/components/seo/ExperiencesStructuredData";
import { type GuideMeta,GUIDES_INDEX } from "@/data/guides.index";
import { resolveGuideTopicId } from "@/data/guideTopics";
import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import { preloadNamespacesWithFallback } from "@/utils/loadI18nNs";
import { getSlug } from "@/utils/slug";
import { getTagMeta } from "@/utils/tags/resolvers";

type Props = {
  lang: AppLanguage;
};

// Filter guides to only include experiences section
function getExperienceGuides(): GuideMeta[] {
  return GUIDES_INDEX.filter(
    (g) => g.section === "experiences" && g.status === "published"
  );
}

function ExperiencesPageContent({ lang }: Props) {
  const searchParams = useSearchParams();
  const { t, ready } = useTranslation("experiencesPage", { lng: lang });
  const { t: tGuides } = useTranslation("guides", { lng: lang });

  // Preload namespaces
  useEffect(() => {
    const loadNamespaces = async () => {
      await preloadNamespacesWithFallback(lang, ["experiencesPage", "guides"], {
        optional: true,
      });
      await i18n.changeLanguage(lang);
    };
    void loadNamespaces();
  }, [lang]);

  const experiencesEnT = useMemo<TFunction>(
    () => i18n.getFixedT("en", "experiencesPage") as TFunction,
    []
  );

  // Parse filter params
  const topicParam = searchParams?.get("topic") ?? null;
  const tagParam = searchParams?.get("tag") ?? null;
  const filterParam = topicParam ?? tagParam;
  const normalizedFilterParam = filterParam?.trim().toLowerCase() ?? "";
  const resolvedTopicId = resolveGuideTopicId(normalizedFilterParam);

  // Get filtered guides
  const experienceGuides = useMemo(() => {
    const allGuides = getExperienceGuides();
    if (!resolvedTopicId && !normalizedFilterParam) return allGuides;
    const filterTag = resolvedTopicId ?? normalizedFilterParam;
    return allGuides.filter((g) => g.tags.includes(filterTag));
  }, [normalizedFilterParam, resolvedTopicId]);

  const clearFilterHref = `/${lang}/${getSlug("experiences", lang)}`;

  // Hero content
  const heroTitle =
    (t("hero.title") as string) ||
    (experiencesEnT("hero.title", { defaultValue: "Experiences" }) as string);
  const heroSubtitle =
    (t("hero.subtitle") as string) ||
    (experiencesEnT("hero.subtitle", { defaultValue: "" }) as string);

  // Collection labels
  const collectionTitle =
    (t("guideCollection.title") as string) ||
    (experiencesEnT("guideCollection.title", {
      defaultValue: "Travel Guides",
    }) as string);
  const collectionSubtitle =
    (t("guideCollection.subtitle") as string) ||
    (experiencesEnT("guideCollection.subtitle", { defaultValue: "" }) as string);

  // Get localized link labels for guides
  const getGuideLabel = (guide: GuideMeta): string => {
    const labelKey = `content.${guide.key}.linkLabel`;
    const label = tGuides(labelKey, { defaultValue: "" }) as string;
    if (label && label !== labelKey) return label;
    // Fallback to converting key to title case
    return guide.key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const guidesSlug = getSlug("guides", lang);

  return (
    <Fragment>
      <ExperiencesStructuredData />
      <section className="bg-brand-surface text-brand-text dark:bg-brand-bg">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-brand-heading sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-lg text-brand-text/80">
                {heroSubtitle}
              </p>
            )}
          </div>
        </div>

        {/* Guide Collection Section */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-brand-heading sm:text-3xl">
              {collectionTitle}
            </h2>
            {collectionSubtitle && (
              <p className="mt-2 text-brand-text/80">{collectionSubtitle}</p>
            )}
            {(resolvedTopicId || normalizedFilterParam) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary">
                  #{resolvedTopicId ?? normalizedFilterParam}
                </span>
                <a
                  href={clearFilterHref}
                  className="text-sm text-brand-primary underline-offset-4 hover:underline"
                >
                  {t("guideCollection.clearFilter", {
                    defaultValue: "Clear filter",
                  }) as string}
                </a>
              </div>
            )}
          </div>

          {/* Guides Grid */}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {experienceGuides.map((guide) => (
              <li key={guide.key}>
                <a
                  href={`/${lang}/${guidesSlug}/${guideSlug(lang, guide.key)}`}
                  className="block rounded-lg border border-brand-outline/40 bg-brand-bg px-4 py-3 text-brand-primary transition-shadow hover:shadow-md dark:bg-brand-text dark:text-brand-secondary"
                >
                  {getGuideLabel(guide)}
                </a>
              </li>
            ))}
          </ul>

          {experienceGuides.length === 0 && (
            <p className="text-center text-brand-text/60">
              {t("guideCollection.noResults", {
                defaultValue: "No guides found for this filter.",
              }) as string}
            </p>
          )}
        </div>
      </section>
    </Fragment>
  );
}

export default memo(ExperiencesPageContent);

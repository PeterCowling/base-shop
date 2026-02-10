// src/components/guides/GuideCollection.tsx
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";
import type { i18n as I18nInstance, TFunction } from "i18next";

import type { GuideMeta } from "@/data/guides.index";
import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";

import {
  type GuideCollectionCopy,
  type GuideCollectionProps,
} from "./GuideCollection.types";
import { GuideCollectionFilters } from "./GuideCollectionFilters";
import { GuideCollectionList } from "./GuideCollectionList";
import { type GuideFilterOption, useGuideFilterOptions } from "./useGuideFilterOptions";
import { useGuideSummaryResolver } from "./useGuideSummaryResolver";

const SECTION_CLASSES = ["mt-16", "px-3", "lg:px-10"] as const;

type Translator = TFunction;

const resolveHeading = (copy: GuideCollectionCopy, hasFilter: boolean): string =>
  hasFilter && copy.taggedHeading ? copy.taggedHeading : copy.heading;

const resolveDescription = (copy: GuideCollectionCopy, hasFilter: boolean): string | undefined =>
  hasFilter ? copy.taggedDescription ?? copy.description : copy.description;

const readGuideResource = (
  i18nInstance: I18nInstance | undefined,
  lang: string,
  key: string,
): string | undefined => {
  if (!i18nInstance || !key) {
    return undefined;
  }

  const store = i18nInstance.services?.resourceStore?.data;
  if (!store) {
    return undefined;
  }

  const namespace = store[lang]?.["guides"];
  if (!namespace || typeof namespace !== "object") {
    return undefined;
  }

  const segments = key.split(".").filter(Boolean);
  let cursor: unknown = namespace;

  for (const segment of segments) {
    if (Array.isArray(cursor)) {
      const index = Number.parseInt(segment, 10);
      if (!Number.isInteger(index) || index < 0 || index >= cursor.length) {
        return undefined;
      }
      cursor = cursor[index];
      continue;
    }

    if (!cursor || typeof cursor !== "object") {
      return undefined;
    }

    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return typeof cursor === "string" ? cursor : undefined;
};

function useGuideCollectionHref(
  filterParam: string | undefined,
  clearFilterHref: string | undefined,
): { basePath: string; makeHref: (value: string | null) => string } {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams?.toString() ?? "";
  const paramName = filterParam?.trim() || "tag";
  const normalizedClearFilterHref = clearFilterHref?.trim() ?? "";
  const sanitizedClearFilterHref = normalizedClearFilterHref === "/" ? "" : normalizedClearFilterHref;
  const normalizedPath = pathname === "/" ? "" : pathname ?? "";
  const basePath = sanitizedClearFilterHref || normalizedPath;

  const makeHref = useCallback(
    (value: string | null): string => {
      const params = new URLSearchParams(searchString);
      if (value) {
        params.set(paramName, value);
      } else {
        params.delete(paramName);
      }
      if (paramName !== "tag") {
        params.delete("tag");
      }
      const query = params.toString();
      if (!basePath) {
        return query ? `?${query}` : "";
      }
      return `${basePath}${query ? `?${query}` : ""}`;
    },
    [basePath, paramName, searchString],
  );

  return { basePath, makeHref };
}

function useGuideCollectionTranslator(
  lang: AppLanguage,
): { i18n: I18nInstance | undefined; translate: Translator } {
  const { t, i18n, ready } = useTranslation("guides", { lng: lang });
  const translate = useMemo<Translator>(() => {
    if (!ready || !i18n) {
      return t as Translator;
    }

    return (((key: string, options?: Record<string, unknown>) => {
      const directTranslation =
        typeof key === "string" ? readGuideResource(i18n, lang, key) : undefined;
      const hasDirectTranslation =
        typeof directTranslation === "string" && directTranslation.trim().length > 0;

      if (!hasDirectTranslation) {
        const defaultValue =
          options && typeof options === "object" && "defaultValue" in options
            ? options["defaultValue"]
            : undefined;
        return typeof defaultValue === "string" ? defaultValue : key;
      }

      return options ? t(key, options) : t(key);
    }) as unknown) as Translator;
  }, [i18n, lang, ready, t]);

  return { i18n: i18n ?? undefined, translate };
}

function useEnglishGuidesFallback(): { hasFixedEnglish: boolean; fallbackGuidesT: Translator } {
  // Prefer checking the global i18n instance for feature support to mirror tests
  const getFixedT = appI18n?.getFixedT;
  const hasFixedEnglish =
    Object.hasOwn?.(appI18n as unknown as Record<string, unknown>, "getFixedT") === true &&
    typeof getFixedT === "function";

  const fallbackGuidesT = useMemo<Translator>(() => {
    if (hasFixedEnglish) {
      const resolved = getFixedT!.call(appI18n, "en", "guides");
      if (typeof resolved === "function") {
        return resolved as Translator;
      }
    }
    // When a fixed English translator is unavailable, avoid falling back to English.
    // Return an empty string to signal "no translation", letting callers fall back to the key.
    return (((_key: string, _options?: Record<string, unknown>) => "") as unknown) as Translator;
  }, [getFixedT, hasFixedEnglish]);

  return { hasFixedEnglish, fallbackGuidesT };
}

function useFilteredGuides(
  guides: readonly GuideMeta[],
  normalizedTag: string,
  filterPredicate: GuideCollectionProps["filterPredicate"],
): readonly GuideMeta[] {
  const defaultFilterPredicate = useCallback(
    (guide: GuideMeta, value: string) =>
      guide.tags.some((tag) => tag.toLowerCase() === value),
    [],
  );
  const resolvedFilterPredicate = filterPredicate ?? defaultFilterPredicate;
  return useMemo(
    () => (normalizedTag ? guides.filter((guide) => resolvedFilterPredicate(guide, normalizedTag)) : guides),
    [guides, normalizedTag, resolvedFilterPredicate],
  );
}

type GuideCollectionIntroProps = {
  heading: string;
  description?: string;
  hasFilter: boolean;
  hasResults: boolean;
  emptyMessage?: string;
  clearFilterHref?: string;
  clearFilterLabel?: string;
  showEmptyStateClearLink: boolean;
};

function GuideCollectionIntro({
  heading,
  description,
  hasFilter,
  hasResults,
  emptyMessage,
  clearFilterHref,
  clearFilterLabel,
  showEmptyStateClearLink,
}: GuideCollectionIntroProps): JSX.Element {
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-heading">
        {heading}
      </h2>
      {description ? (
        <p className="text-brand-paragraph dark:text-brand-muted text-pretty text-base">
          {description}
        </p>
      ) : null}
      {hasFilter && !hasResults && emptyMessage ? (
        <div className="text-brand-paragraph dark:text-brand-muted rounded-lg border border-brand-outline/40 bg-brand-surface/60 p-4 text-sm dark:border-brand-outline/50 dark:bg-brand-text/10">
          <p>{emptyMessage}</p>
          {showEmptyStateClearLink && clearFilterHref && clearFilterLabel ? (
            <p className="mt-2">
              <Link
                href={clearFilterHref}
                scroll={false}
                className="inline-flex min-h-11 items-center font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 dark:text-brand-secondary"
              >
                {clearFilterLabel}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type GuideCollectionFilterPanelProps = {
  showFilterPanel: boolean;
  filterHeading: string;
  filterDescription: string;
  filterLabel: string;
  allHref: string;
  clearFilterLabel: string;
  totalCount: number;
  options: readonly GuideFilterOption[];
  activeTag: string;
  makeHref: (value: string | null) => string;
  useRelativeAnchors: boolean;
};

function GuideCollectionFilterPanel({
  showFilterPanel,
  filterHeading,
  filterDescription,
  filterLabel,
  allHref,
  clearFilterLabel,
  totalCount,
  options,
  activeTag,
  makeHref,
  useRelativeAnchors,
}: GuideCollectionFilterPanelProps): JSX.Element | null {
  if (!showFilterPanel) {
    return null;
  }

  return (
    <GuideCollectionFilters
      heading={filterHeading}
      description={filterDescription}
      label={filterLabel}
      allHref={allHref}
      clearFilterLabel={clearFilterLabel}
      totalCount={totalCount}
      options={options}
      activeTag={activeTag}
      makeHref={makeHref}
      // Use plain anchors for query-only links to preserve relative href like "?tag=…"
      useRelativeAnchors={useRelativeAnchors}
    />
  );
}

type GuideCollectionResultsProps = {
  hasResults: boolean;
  lang: AppLanguage;
  guides: readonly GuideMeta[];
  translate: Translator;
  fallbackTranslate: Translator;
  copy: GuideCollectionCopy;
  resolveSummary: ReturnType<typeof useGuideSummaryResolver>;
  allowEnglishFallback: boolean;
};

function GuideCollectionResults({
  hasResults,
  lang,
  guides,
  translate,
  fallbackTranslate,
  copy,
  resolveSummary,
  allowEnglishFallback,
}: GuideCollectionResultsProps): JSX.Element | null {
  if (!hasResults) {
    return null;
  }

  return (
    <GuideCollectionList
      lang={lang}
      guides={guides}
      translate={translate}
      fallbackTranslate={fallbackTranslate}
      copy={copy}
      resolveSummary={resolveSummary}
      allowEnglishFallback={allowEnglishFallback}
    />
  );
}

function GuideCollection({
  lang,
  guides,
  id,
  totalCount: totalCountProp,
  filterTag,
  filterParam,
  filterOptions: filterOptionsProp,
  filterPredicate,
  clearFilterHref,
  sectionClassName,
  copy,
  showFilters = true,
}: GuideCollectionProps): JSX.Element | null {
  const normalizedTag = filterTag?.trim().toLowerCase() ?? "";
  const { basePath, makeHref } = useGuideCollectionHref(filterParam, clearFilterHref);
  const { i18n, translate } = useGuideCollectionTranslator(lang);
  const { hasFixedEnglish, fallbackGuidesT } = useEnglishGuidesFallback();
  const filtered = useFilteredGuides(guides, normalizedTag, filterPredicate);

  const defaultFilterOptions = useGuideFilterOptions(guides);
  const filterOptions = filterOptionsProp ?? defaultFilterOptions;
  const resolveSummary = useGuideSummaryResolver(i18n, lang);

  const hasFilter = Boolean(normalizedTag);
  const hasResults = filtered.length > 0;
  const heading = resolveHeading(copy, hasFilter);
  const description = resolveDescription(copy, hasFilter);
  const totalCount = typeof totalCountProp === "number" ? totalCountProp : guides.length;

  const filterHeading = copy.filterHeading ?? "";
  const filterDescription = copy.filterDescription ?? "";
  const showFilterPanel = Boolean(showFilters && filterHeading && filterOptions.length);
  const showEmptyStateClearLink = Boolean(
    clearFilterHref && copy.clearFilterLabel && !showFilterPanel,
  );
  const filterLabel = filterHeading || copy.heading;
  const clearFilterLabel = copy.clearFilterLabel ?? copy.heading;
  const allHref = makeHref(null);

  if (!hasResults && !guides.length) {
    return null;
  }

  return (
    <section id={id} className={clsx(SECTION_CLASSES, sectionClassName)}>
      <GuideCollectionIntro
        heading={heading}
        description={description}
        hasFilter={hasFilter}
        hasResults={hasResults}
        emptyMessage={copy.emptyMessage}
        clearFilterHref={clearFilterHref}
        clearFilterLabel={copy.clearFilterLabel}
        showEmptyStateClearLink={showEmptyStateClearLink}
      />

      <GuideCollectionFilterPanel
        showFilterPanel={showFilterPanel}
        filterHeading={filterHeading}
        filterDescription={filterDescription}
        filterLabel={filterLabel}
        allHref={allHref}
        clearFilterLabel={clearFilterLabel}
        totalCount={totalCount}
        options={filterOptions}
        activeTag={normalizedTag}
        makeHref={makeHref}
        useRelativeAnchors={!basePath}
      />

      <GuideCollectionResults
        hasResults={hasResults}
        lang={lang}
        guides={filtered}
        translate={translate}
        fallbackTranslate={fallbackGuidesT}
        copy={copy}
        resolveSummary={resolveSummary}
        allowEnglishFallback={hasFixedEnglish}
      />
    </section>
  );
}

export default memo(GuideCollection);

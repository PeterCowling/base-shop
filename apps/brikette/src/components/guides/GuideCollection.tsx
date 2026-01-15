// src/components/guides/GuideCollection.tsx
import { memo, useCallback, useMemo } from "react";
import { Link, useLocation, type To } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction, i18n as I18nInstance } from "i18next";
import clsx from "clsx";

import type { GuideMeta } from "@/data/guides.index";
import {
  type GuideCollectionProps,
  type GuideCollectionCopy,
} from "./GuideCollection.types";
import { GuideCollectionFilters } from "./GuideCollectionFilters";
import { GuideCollectionList } from "./GuideCollectionList";
import { useGuideFilterOptions } from "./useGuideFilterOptions";
import { useGuideSummaryResolver } from "./useGuideSummaryResolver";
import appI18n from "@/i18n";

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
  const paramName = filterParam?.trim() || "tag";

  const location = useLocation();
  const normalizedClearFilterHref = clearFilterHref?.trim() ?? "";
  const sanitizedClearFilterHref = normalizedClearFilterHref === "/" ? "" : normalizedClearFilterHref;
  const normalizedPath = location.pathname === "/" ? "" : location.pathname;
  const basePath = sanitizedClearFilterHref || normalizedPath;
  const makeHref = useCallback(
    (value: string | null): To => {
      const params = new URLSearchParams(location.search);
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
        if (!query) {
          return "";
        }
        return `?${query}`;
      }
      return `${basePath}${query ? `?${query}` : ""}`;
    },
    [basePath, location.search, paramName],
  );

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
  }, [i18n, lang, t, ready]);

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

  const defaultFilterPredicate = useCallback(
    (guide: GuideMeta, value: string) =>
      guide.tags.some((tag) => tag.toLowerCase() === value),
    [],
  );
  const resolvedFilterPredicate = filterPredicate ?? defaultFilterPredicate;
  const filtered = useMemo(
    () => (normalizedTag ? guides.filter((guide) => resolvedFilterPredicate(guide, normalizedTag)) : guides),
    [guides, normalizedTag, resolvedFilterPredicate],
  );

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
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-surface">
          {heading}
        </h2>
        {description ? (
          <p className="text-brand-paragraph dark:text-brand-muted-dark text-pretty text-base">
            {description}
          </p>
        ) : null}
        {hasFilter && !hasResults && copy.emptyMessage ? (
          <div className="text-brand-paragraph dark:text-brand-muted-dark rounded-lg border border-brand-outline/40 bg-brand-surface/60 p-4 text-sm dark:border-brand-outline/50 dark:bg-brand-text/10">
            <p>{copy.emptyMessage}</p>
            {showEmptyStateClearLink && clearFilterHref ? (
              <p className="mt-2">
                <Link
                  to={clearFilterHref}
                  preventScrollReset
                  className="font-semibold text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary"
                >
                  {copy.clearFilterLabel}
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {showFilterPanel ? (
        <GuideCollectionFilters
          heading={filterHeading}
          description={filterDescription}
          label={filterLabel}
          allHref={allHref}
          clearFilterLabel={clearFilterLabel}
          totalCount={totalCount}
          options={filterOptions}
          activeTag={normalizedTag}
          makeHref={makeHref}
          // Use plain anchors for query-only links to preserve relative href like "?tag=…"
          useRelativeAnchors={!basePath}
        />
      ) : null}

      {hasResults ? (
        <GuideCollectionList
          lang={lang}
          guides={filtered}
          translate={translate}
          fallbackTranslate={fallbackGuidesT}
          copy={copy}
          resolveSummary={resolveSummary}
          allowEnglishFallback={hasFixedEnglish}
        />
      ) : null}
    </section>
  );
}

export default memo(GuideCollection);

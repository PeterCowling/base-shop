/**
 * GuideCollectionWithSearch - GuideCollection with integrated full-text search
 *
 * Wraps GuideCollection with BM25 search functionality, allowing users to
 * search guides by text in addition to filtering by tags.
 */

import { memo, useMemo } from "react";

import { GUIDES_INDEX, type GuideMeta } from "@/data/guides.index";
import { useGuideSearch } from "@/hooks/useGuideSearch";

import GuideCollection from "./GuideCollection";
import type { GuideCollectionProps } from "./GuideCollection.types";
import { GuideSearchBar } from "./GuideSearchBar";

export interface GuideCollectionWithSearchProps extends GuideCollectionProps {
  /** Enable search functionality (default: true) */
  enableSearch?: boolean;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
}

/**
 * GuideCollection with integrated full-text search
 *
 * When search is active:
 * - Results are filtered by search relevance (BM25 ranking)
 * - Tag filtering is still available and combines with search
 * - Fuzzy suggestions appear for typos
 *
 * @example
 * ```tsx
 * <GuideCollectionWithSearch
 *   lang="en"
 *   guides={experienceGuides}
 *   copy={copy}
 *   enableSearch
 * />
 * ```
 */
function GuideCollectionWithSearch({
  lang,
  guides,
  enableSearch = true,
  searchPlaceholder,
  ...props
}: GuideCollectionWithSearchProps): JSX.Element | null {
  // Create a filter function that only includes guides from the provided list
  const guideKeySet = useMemo(
    () => new Set(guides.map((g) => g.key)),
    [guides]
  );

  const filter = useMemo(
    () => (guide: GuideMeta) => guideKeySet.has(guide.key),
    [guideKeySet]
  );

  const {
    results,
    suggestions,
    isSearching,
    query,
    setQuery,
    isReady,
  } = useGuideSearch({
    filter,
    debounceMs: 200,
    limit: 50,
    includeSuggestions: true,
  });

  // When searching, filter guides to match search results
  const displayGuides = useMemo(() => {
    if (!query.trim() || !isReady) {
      return guides;
    }

    // Map search results back to guide metadata
    const resultKeySet = new Set(results.map((r) => r.key));
    const guidesArray = Array.isArray(guides) ? guides : Array.from(guides);

    // Sort guides by search result order (relevance)
    const sortedGuides = guidesArray
      .filter((g) => resultKeySet.has(g.key))
      .sort((a, b) => {
        const aIndex = results.findIndex((r) => r.key === a.key);
        const bIndex = results.findIndex((r) => r.key === b.key);
        return aIndex - bIndex;
      });

    return sortedGuides;
  }, [guides, query, results, isReady]);

  if (!enableSearch) {
    return <GuideCollection lang={lang} guides={guides} {...props} />;
  }

  return (
    <div>
      {/* Search bar positioned above the collection */}
      <div className="mb-6 px-3 lg:px-10">
        <GuideSearchBar
          query={query}
          onChange={setQuery}
          suggestions={suggestions}
          isSearching={isSearching}
          placeholder={searchPlaceholder}
          onSuggestionClick={(suggestion) => {
            // When clicking a suggestion, use it as the new query
            setQuery(suggestion);
          }}
        />
        {query.trim() && isReady && (
          <p className="mt-2 text-sm text-brand-muted dark:text-brand-muted-dark">
            {displayGuides.length === 0
              ? "No guides found"
              : `Found ${displayGuides.length} guide${displayGuides.length === 1 ? "" : "s"}`}
          </p>
        )}
      </div>

      <GuideCollection
        lang={lang}
        guides={displayGuides}
        {...props}
      />
    </div>
  );
}

export default memo(GuideCollectionWithSearch);

/**
 * useGuideSearch - React hook for searching guides
 *
 * Provides full-text search with BM25 relevance ranking and fuzzy suggestions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { type GuideMeta,GUIDES_INDEX } from "@/data/guides.index";
import {
  getGuideSearchService,
  type GuideSearchResult,
} from "@/lib/search/guide-search";

import { useCurrentLanguage } from "./useCurrentLanguage";

/**
 * Options for useGuideSearch hook
 */
export interface UseGuideSearchOptions {
  /** Debounce delay in ms (default: 200) */
  debounceMs?: number;
  /** Maximum results to return (default: 20) */
  limit?: number;
  /** Filter to apply to guides before indexing (e.g., only published) */
  filter?: (guide: GuideMeta) => boolean;
  /** Whether to include fuzzy suggestions (default: true) */
  includeSuggestions?: boolean;
}

/**
 * Return value from useGuideSearch hook
 */
export interface UseGuideSearchReturn {
  /** Search results ranked by relevance */
  results: GuideSearchResult[];
  /** Fuzzy suggestions if query has no exact matches */
  suggestions: string[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Current search query */
  query: string;
  /** Update the search query */
  setQuery: (query: string) => void;
  /** Clear search and results */
  clear: () => void;
  /** Whether the index is ready */
  isReady: boolean;
}

const DEFAULT_OPTIONS: Required<UseGuideSearchOptions> = {
  debounceMs: 200,
  limit: 20,
  filter: () => true,
  includeSuggestions: true,
};

/**
 * React hook for searching guides with BM25 relevance ranking
 *
 * @example
 * ```tsx
 * function GuideSearchBox() {
 *   const { results, suggestions, query, setQuery, isSearching } = useGuideSearch();
 *
 *   return (
 *     <div>
 *       <input
 *         value={query}
 *         onChange={(e) => setQuery(e.target.value)}
 *         placeholder="Search guides..."
 *       />
 *       {isSearching && <span>Searching...</span>}
 *       {results.map((r) => (
 *         <div key={r.key}>{r.key} (score: {r.score.toFixed(2)})</div>
 *       ))}
 *       {suggestions.length > 0 && (
 *         <div>Did you mean: {suggestions.join(', ')}?</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGuideSearch(
  options?: UseGuideSearchOptions
): UseGuideSearchReturn {
  const { debounceMs, limit, filter, includeSuggestions } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const lang = useCurrentLanguage();
  const { t, i18n } = useTranslation("guides");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GuideSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoize filtered guides
  const filteredGuides = useMemo(
    () => GUIDES_INDEX.filter(filter),
    [filter]
  );

  // Build/rebuild index when language changes
  useEffect(() => {
    const service = getGuideSearchService();

    // Skip if already built for this language
    if (service.hasIndex(lang)) {
      setIsReady(true);
      return;
    }

    // Helper to get guide title
    const getTitle = (key: string): string => {
      // Try multiple translation keys for title
      const translationKey = `content.${key}.meta.title`;
      const fallbackKey = `content.${key}.seo.title`;
      const labelKey = `content.${key}.label`;

      let title = t(translationKey, { defaultValue: "" });
      if (!title) title = t(fallbackKey, { defaultValue: "" });
      if (!title) title = t(labelKey, { defaultValue: "" });
      if (!title) {
        // Fallback: convert key to readable format
        title = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (s) => s.toUpperCase())
          .trim();
      }

      return title;
    };

    // Helper to get guide summary
    const getSummary = (key: string): string | undefined => {
      const descKey = `content.${key}.seo.description`;
      const introKey = `content.${key}.meta.intro`;
      const contentIntroKey = `content.${key}.content.intro`;

      let summary = t(descKey, { defaultValue: "" });
      if (!summary) summary = t(introKey, { defaultValue: "" });
      if (!summary) summary = t(contentIntroKey, { defaultValue: "" });

      return summary || undefined;
    };

    // Build index
    service.buildIndex(lang, filteredGuides, getTitle, getSummary);
    setIsReady(true);
  }, [lang, filteredGuides, t, i18n]);

  // Perform search with debounce
  const performSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      const service = getGuideSearchService();
      const searchResults = service.search(lang, searchQuery, limit);

      setResults(searchResults);

      // Get suggestions if no results and suggestions are enabled
      if (includeSuggestions && searchResults.length === 0) {
        const words = searchQuery.trim().split(/\s+/);
        const allSuggestions = new Set<string>();

        for (const word of words) {
          const wordSuggestions = service.suggest(lang, word, 2);
          for (const suggestion of wordSuggestions) {
            allSuggestions.add(suggestion);
          }
        }

        setSuggestions(Array.from(allSuggestions).slice(0, 5));
      } else {
        setSuggestions([]);
      }

      setIsSearching(false);
    },
    [lang, limit, includeSuggestions]
  );

  // Handle query changes with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsSearching(true);

    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, performSearch]);

  // Clear function
  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
    setIsSearching(false);
  }, []);

  return {
    results,
    suggestions,
    isSearching,
    query,
    setQuery,
    clear,
    isReady,
  };
}

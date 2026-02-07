/**
 * Guide Search Service
 *
 * Full-text search across guides using BM25 relevance ranking.
 * Supports per-language index management and fuzzy suggestions via BKTree.
 */

import {
  BKTree,
  BM25Index,
  type SearchResult,
  stemmedTokenizer,
} from "@acme/lib";

import type { GuideMeta } from "@/data/guides.index";

/**
 * Document structure for indexing guides
 */
export interface GuideDocument {
  id: string;
  fields: {
    title: string;
    tags: string;
    summary: string;
  };
}

/**
 * Search result with guide metadata
 */
export interface GuideSearchResult {
  /** Guide key */
  key: string;
  /** BM25 relevance score */
  score: number;
  /** Matching terms per field */
  matches: {
    title?: string[];
    tags?: string[];
    summary?: string[];
  };
}

/**
 * Options for building a guide search index
 */
export interface GuideSearchIndexOptions {
  /** Field boost weights */
  boosts?: {
    title?: number;
    tags?: number;
    summary?: number;
  };
}

const DEFAULT_BOOSTS = {
  title: 2.0,
  tags: 1.5,
  summary: 1.0,
} as const;

/**
 * Guide Search Service
 *
 * Manages BM25 indices per language for full-text guide search.
 *
 * @example
 * ```typescript
 * const service = new GuideSearchService();
 *
 * // Build index for English guides
 * service.buildIndex('en', guides, getTitle, getSummary);
 *
 * // Search
 * const results = service.search('en', 'beach hiking');
 * // [{ key: 'positanoBeaches', score: 2.3, matches: { title: ['beach'], tags: ['beaches'] } }]
 *
 * // Get fuzzy suggestions for typos
 * const suggestions = service.suggest('en', 'bech'); // ['beach', 'beaches']
 * ```
 */
export class GuideSearchService {
  private indices: Map<string, BM25Index> = new Map();
  private suggestionTrees: Map<string, BKTree> = new Map();
  private options: Required<GuideSearchIndexOptions>;

  constructor(options?: GuideSearchIndexOptions) {
    this.options = {
      boosts: {
        title: options?.boosts?.title ?? DEFAULT_BOOSTS.title,
        tags: options?.boosts?.tags ?? DEFAULT_BOOSTS.tags,
        summary: options?.boosts?.summary ?? DEFAULT_BOOSTS.summary,
      },
    };
  }

  /**
   * Build a search index for a specific language
   *
   * @param lang Language code (e.g., 'en', 'de', 'fr')
   * @param guides Guide metadata array
   * @param getTitle Function to get translated title for a guide
   * @param getSummary Function to get translated summary for a guide
   */
  buildIndex(
    lang: string,
    guides: GuideMeta[],
    getTitle: (key: string) => string,
    getSummary: (key: string) => string | undefined
  ): void {
    const index = new BM25Index(undefined, stemmedTokenizer);

    // Define fields with boosts
    index.defineField("title", { boost: this.options.boosts.title });
    index.defineField("tags", { boost: this.options.boosts.tags });
    index.defineField("summary", { boost: this.options.boosts.summary });

    // Collect all terms for suggestion tree
    const allTerms = new Set<string>();

    // Add guides to index
    for (const guide of guides) {
      const title = getTitle(guide.key);
      const summary = getSummary(guide.key) ?? "";
      const tags = guide.tags.join(" ");

      index.addDocument({
        id: guide.key,
        fields: {
          title,
          tags,
          summary,
        },
      });

      // Collect terms for fuzzy suggestions
      const titleTerms = title.toLowerCase().split(/\s+/);
      const tagTerms = guide.tags.map((t) => t.toLowerCase());

      for (const term of titleTerms) {
        if (term.length > 2) allTerms.add(term);
      }
      for (const term of tagTerms) {
        if (term.length > 2) allTerms.add(term);
      }
    }

    this.indices.set(lang, index);

    // Build BKTree for fuzzy suggestions
    const tree = new BKTree();
    tree.addAll(Array.from(allTerms));
    this.suggestionTrees.set(lang, tree);
  }

  /**
   * Check if an index exists for a language
   */
  hasIndex(lang: string): boolean {
    return this.indices.has(lang);
  }

  /**
   * Search guides in a specific language
   *
   * @param lang Language code
   * @param query Search query
   * @param limit Maximum results (default: 20)
   * @returns Ranked search results
   */
  search(lang: string, query: string, limit: number = 20): GuideSearchResult[] {
    const index = this.indices.get(lang);
    if (!index) {
      return [];
    }

    const results = index.search(query, limit);

    return results.map((result: SearchResult) => ({
      key: result.id,
      score: result.score,
      matches: {
        title: result.matches["title"],
        tags: result.matches["tags"],
        summary: result.matches["summary"],
      },
    }));
  }

  /**
   * Get fuzzy suggestions for a potentially misspelled query term
   *
   * @param lang Language code
   * @param query Query term (single word)
   * @param maxDistance Maximum edit distance (default: 2)
   * @returns Array of suggested terms
   */
  suggest(lang: string, query: string, maxDistance: number = 2): string[] {
    const tree = this.suggestionTrees.get(lang);
    if (!tree) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    if (normalizedQuery.length < 2) {
      return [];
    }

    const results = tree.search(normalizedQuery, maxDistance);

    // Filter out exact match and sort by distance, then alphabetically
    return results
      .filter((r) => r.word !== normalizedQuery)
      .map((r) => r.word);
  }

  /**
   * Get the nearest match for a query term
   *
   * @param lang Language code
   * @param query Query term
   * @returns Nearest matching term, or null if tree is empty
   */
  nearestTerm(lang: string, query: string): string | null {
    const tree = this.suggestionTrees.get(lang);
    if (!tree) {
      return null;
    }

    const result = tree.nearest(query.toLowerCase().trim());
    return result?.word ?? null;
  }

  /**
   * Get index statistics for a language
   */
  getStats(lang: string): { documentCount: number; termCount: number } | null {
    const index = this.indices.get(lang);
    if (!index) {
      return null;
    }

    return {
      documentCount: index.documentCount,
      termCount: index.termCount,
    };
  }

  /**
   * Clear the index for a specific language
   */
  clearIndex(lang: string): void {
    this.indices.delete(lang);
    this.suggestionTrees.delete(lang);
  }

  /**
   * Clear all indices
   */
  clearAll(): void {
    this.indices.clear();
    this.suggestionTrees.clear();
  }
}

// Singleton instance for app-wide use
let _instance: GuideSearchService | null = null;

/**
 * Get the shared GuideSearchService instance
 */
export function getGuideSearchService(): GuideSearchService {
  if (!_instance) {
    _instance = new GuideSearchService();
  }
  return _instance;
}

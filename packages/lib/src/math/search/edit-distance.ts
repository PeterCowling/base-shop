/**
 * Edit Distance and BK-Tree - Typo-tolerant search utilities
 *
 * Provides efficient fuzzy string matching for "Did you mean...?" suggestions,
 * autocomplete with typo tolerance, and fuzzy product name matching.
 *
 * @see Wagner & Fischer, "The String-to-String Correction Problem"
 * @see Burkhard & Keller, "Some approaches to best-match file searching"
 */

/**
 * Calculate Levenshtein distance between two strings.
 *
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one string
 * into the other.
 *
 * @param a First string
 * @param b Second string
 * @returns Number of edits required
 *
 * @example
 * ```typescript
 * levenshtein("kitten", "sitting"); // 3
 * levenshtein("book", "back");      // 2
 * levenshtein("", "abc");           // 3
 * ```
 */
export function levenshtein(a: string, b: string): number {
  // Handle empty strings
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for space optimization
  if (a.length > b.length) {
    [a, b] = [b, a];
  }

  const m = a.length;
  const n = b.length;

  // Use single array for space optimization O(min(m,n))
  let prev = new Array<number>(m + 1);
  let curr = new Array<number>(m + 1);

  // Initialize first row
  for (let i = 0; i <= m; i++) {
    prev[i] = i;
  }

  // Fill the matrix row by row
  for (let j = 1; j <= n; j++) {
    curr[0] = j;

    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      curr[i] = Math.min(
        prev[i] + 1, // deletion
        curr[i - 1] + 1, // insertion
        prev[i - 1] + cost // substitution
      );
    }

    // Swap rows
    [prev, curr] = [curr, prev];
  }

  return prev[m];
}

/**
 * Calculate Damerau-Levenshtein distance between two strings.
 *
 * Extends Levenshtein distance by also allowing transpositions of two
 * adjacent characters as a single edit operation. This better models
 * common typing errors like "teh" → "the".
 *
 * @param a First string
 * @param b Second string
 * @returns Number of edits required (including transpositions)
 *
 * @example
 * ```typescript
 * damerauLevenshtein("ca", "abc");   // 2 (Levenshtein would be 2)
 * damerauLevenshtein("teh", "the");  // 1 (transposition)
 * damerauLevenshtein("kitten", "sitting"); // 3
 * ```
 */
export function damerauLevenshtein(a: string, b: string): number {
  // Handle empty strings
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const m = a.length;
  const n = b.length;

  // Create matrix with extra row/column for empty string
  const d: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );

  // Initialize first column
  for (let i = 0; i <= m; i++) {
    d[i][0] = i;
  }

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Check for transposition
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[m][n];
}

/**
 * Calculate normalized distance between two strings (0-1 range).
 *
 * Returns a value between 0 (identical) and 1 (completely different),
 * normalized by the length of the longer string.
 *
 * @param a First string
 * @param b Second string
 * @param useDamerau If true, use Damerau-Levenshtein (default: false)
 * @returns Normalized distance between 0 and 1
 *
 * @example
 * ```typescript
 * normalizedDistance("abc", "abc");     // 0
 * normalizedDistance("abc", "xyz");     // 1
 * normalizedDistance("hello", "hallo"); // 0.2
 * ```
 */
export function normalizedDistance(
  a: string,
  b: string,
  useDamerau: boolean = false
): number {
  if (a.length === 0 && b.length === 0) return 0;

  const distance = useDamerau ? damerauLevenshtein(a, b) : levenshtein(a, b);
  const maxLength = Math.max(a.length, b.length);

  return distance / maxLength;
}

/**
 * Calculate similarity between two strings (0-1 range).
 *
 * Returns a value between 0 (completely different) and 1 (identical).
 * This is simply 1 - normalizedDistance.
 *
 * @param a First string
 * @param b Second string
 * @param useDamerau If true, use Damerau-Levenshtein (default: false)
 * @returns Similarity between 0 and 1
 *
 * @example
 * ```typescript
 * similarity("abc", "abc");     // 1
 * similarity("abc", "xyz");     // 0
 * similarity("hello", "hallo"); // 0.8
 * ```
 */
export function similarity(
  a: string,
  b: string,
  useDamerau: boolean = false
): number {
  return 1 - normalizedDistance(a, b, useDamerau);
}

/**
 * Result from a BK-Tree search
 */
export interface BKTreeSearchResult {
  /** The matched word */
  word: string;
  /** Edit distance from query */
  distance: number;
}

/**
 * Internal node structure for BK-Tree
 */
interface BKTreeNode {
  word: string;
  children: Map<number, BKTreeNode>;
}

/**
 * Distance function type for BK-Tree
 */
export type DistanceFunction = (a: string, b: string) => number;

/**
 * BK-Tree (Burkhard-Keller Tree) for efficient fuzzy string search.
 *
 * A BK-Tree is a metric tree designed for discrete metric spaces.
 * It enables efficient similarity searches by pruning branches that
 * cannot contain matches within the specified distance threshold.
 *
 * Time complexity: O(n^(1-1/d)) average case for search, where d is
 * the dimensionality of the metric space. Much faster than naive O(n).
 *
 * @example
 * ```typescript
 * const tree = new BKTree();
 * tree.addAll(["book", "back", "cook", "hook", "look", "took"]);
 *
 * // Find all words within distance 1 of "book"
 * tree.search("book", 1);
 * // [{ word: "book", distance: 0 }, { word: "cook", distance: 1 },
 * //  { word: "hook", distance: 1 }, { word: "look", distance: 1 },
 * //  { word: "took", distance: 1 }]
 *
 * // Find closest match
 * tree.nearest("boook"); // { word: "book", distance: 1 }
 * ```
 */
export class BKTree {
  private root: BKTreeNode | null = null;
  private _size: number = 0;
  private readonly distanceFn: DistanceFunction;

  /**
   * Create a new BK-Tree
   *
   * @param distanceFn Distance function to use (default: levenshtein)
   */
  constructor(distanceFn: DistanceFunction = levenshtein) {
    this.distanceFn = distanceFn;
  }

  /**
   * Add a word to the tree
   *
   * @param word Word to add
   */
  add(word: string): void {
    if (this.root === null) {
      this.root = { word, children: new Map() };
      this._size++;
      return;
    }

    let node = this.root;

    while (true) {
      const distance = this.distanceFn(word, node.word);

      // Duplicate word
      if (distance === 0) {
        return;
      }

      const child = node.children.get(distance);
      if (child === undefined) {
        node.children.set(distance, { word, children: new Map() });
        this._size++;
        return;
      }

      node = child;
    }
  }

  /**
   * Add multiple words to the tree
   *
   * @param words Words to add
   */
  addAll(words: string[]): void {
    for (const word of words) {
      this.add(word);
    }
  }

  /**
   * Find all words within a given distance of the query
   *
   * @param query Query string
   * @param maxDistance Maximum edit distance (inclusive)
   * @returns Array of matches sorted by distance (ascending)
   */
  search(query: string, maxDistance: number): BKTreeSearchResult[] {
    if (this.root === null) {
      return [];
    }

    const results: BKTreeSearchResult[] = [];
    const stack: BKTreeNode[] = [this.root];

    while (stack.length > 0) {
      const node = stack.pop()!;
      const distance = this.distanceFn(query, node.word);

      if (distance <= maxDistance) {
        results.push({ word: node.word, distance });
      }

      // BK-Tree pruning: only explore children within [d-maxDistance, d+maxDistance]
      const minDist = Math.max(0, distance - maxDistance);
      const maxDist = distance + maxDistance;

      for (const [childDist, child] of node.children) {
        if (childDist >= minDist && childDist <= maxDist) {
          stack.push(child);
        }
      }
    }

    // Sort by distance, then alphabetically for stable ordering
    results.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.word.localeCompare(b.word);
    });

    return results;
  }

  /**
   * Find the closest match to a query
   *
   * @param query Query string
   * @returns Closest match, or null if tree is empty
   */
  nearest(query: string): BKTreeSearchResult | null {
    if (this.root === null) {
      return null;
    }

    let best: BKTreeSearchResult | null = null;
    let bestDistance = Infinity;
    const stack: BKTreeNode[] = [this.root];

    while (stack.length > 0) {
      const node = stack.pop()!;
      const distance = this.distanceFn(query, node.word);

      if (distance < bestDistance) {
        best = { word: node.word, distance };
        bestDistance = distance;

        // Early exit for exact match
        if (distance === 0) {
          return best;
        }
      }

      // Prune branches that cannot contain closer matches
      for (const [childDist, child] of node.children) {
        if (childDist >= distance - bestDistance && childDist <= distance + bestDistance) {
          stack.push(child);
        }
      }
    }

    return best;
  }

  /**
   * Check if the tree contains a word
   *
   * @param word Word to check
   * @returns true if word exists in tree
   */
  contains(word: string): boolean {
    if (this.root === null) {
      return false;
    }

    let node: BKTreeNode | undefined = this.root;

    while (node !== undefined) {
      const distance = this.distanceFn(word, node.word);
      if (distance === 0) {
        return true;
      }
      node = node.children.get(distance);
    }

    return false;
  }

  /**
   * Number of words in the tree
   */
  get size(): number {
    return this._size;
  }
}

/**
 * Generate n-grams from a string.
 *
 * N-grams are contiguous sequences of n characters. They're useful for
 * approximate string matching and candidate generation.
 *
 * @param text Input text
 * @param n N-gram size (default: 2 for bigrams)
 * @returns Array of n-grams
 *
 * @example
 * ```typescript
 * ngrams("hello", 2); // ["he", "el", "ll", "lo"]
 * ngrams("abc", 3);   // ["abc"]
 * ngrams("ab", 3);    // []
 * ```
 */
export function ngrams(text: string, n: number = 2): string[] {
  if (n <= 0 || !Number.isInteger(n)) {
    throw new Error("N must be a positive integer");
  }

  if (text.length < n) {
    return [];
  }

  const result: string[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    result.push(text.slice(i, i + n));
  }
  return result;
}

/**
 * Calculate n-gram similarity (Jaccard coefficient) between two strings.
 *
 * The Jaccard coefficient is the size of the intersection divided by
 * the size of the union of the n-gram sets.
 *
 * @param a First string
 * @param b Second string
 * @param n N-gram size (default: 2)
 * @returns Similarity between 0 and 1
 *
 * @example
 * ```typescript
 * ngramSimilarity("night", "nacht", 2);  // ~0.25
 * ngramSimilarity("hello", "hello", 2);  // 1
 * ngramSimilarity("abc", "xyz", 2);      // 0
 * ```
 */
export function ngramSimilarity(a: string, b: string, n: number = 2): number {
  const ngramsA = new Set(ngrams(a, n));
  const ngramsB = new Set(ngrams(b, n));

  if (ngramsA.size === 0 && ngramsB.size === 0) {
    // Both strings too short for n-grams, compare equality
    return a === b ? 1 : 0;
  }

  if (ngramsA.size === 0 || ngramsB.size === 0) {
    return 0;
  }

  // Calculate intersection size
  let intersection = 0;
  for (const gram of ngramsA) {
    if (ngramsB.has(gram)) {
      intersection++;
    }
  }

  // Union size = |A| + |B| - |intersection|
  const union = ngramsA.size + ngramsB.size - intersection;

  return intersection / union;
}

/**
 * Find candidate matches using n-gram blocking.
 *
 * This is a fast pre-filtering step that finds strings likely to be
 * similar based on shared n-grams. Use this to reduce the candidate
 * set before computing exact edit distances.
 *
 * @param query Query string
 * @param candidates Candidate strings to filter
 * @param minSimilarity Minimum n-gram similarity threshold (default: 0.2)
 * @param n N-gram size (default: 2)
 * @returns Candidates above the similarity threshold
 *
 * @example
 * ```typescript
 * const words = ["book", "cook", "look", "apple", "banana"];
 * findCandidates("boook", words, 0.3);
 * // ["book", "cook", "look"] - high n-gram overlap
 * ```
 */
export function findCandidates(
  query: string,
  candidates: string[],
  minSimilarity: number = 0.2,
  n: number = 2
): string[] {
  return candidates.filter(
    (candidate) => ngramSimilarity(query, candidate, n) >= minSimilarity
  );
}

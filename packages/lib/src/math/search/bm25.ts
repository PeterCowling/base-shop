/**
 * BM25 Search Index - Relevance-ranked text search
 *
 * BM25 (Best Matching 25) is a probabilistic ranking function used by search
 * engines to rank documents based on query term relevance. It builds on TF-IDF
 * by adding term saturation and document length normalization.
 *
 * Use cases:
 * - Product search with field weighting (title > description)
 * - Collection/category search
 * - Blog/content search
 *
 * @see Robertson & Zaragoza, "The Probabilistic Relevance Framework"
 */

/**
 * Configuration options for BM25 scoring
 */
export interface BM25Options {
  /**
   * Term saturation parameter (default: 1.2).
   * Controls how quickly term frequency saturates.
   * Higher values = more weight to term frequency.
   */
  k1?: number;

  /**
   * Length normalization parameter (default: 0.75).
   * 0 = no length normalization, 1 = full normalization.
   */
  b?: number;
}

/**
 * Document to be indexed
 */
export interface Document {
  /** Unique document identifier */
  id: string;
  /** Field name to text content mapping */
  fields: Record<string, string>;
}

/**
 * Configuration for a searchable field
 */
export interface FieldConfig {
  /** Weight multiplier for this field (default: 1.0) */
  boost?: number;
}

/**
 * Search result with relevance score
 */
export interface SearchResult {
  /** Document ID */
  id: string;
  /** BM25 relevance score */
  score: number;
  /** Matching terms per field */
  matches: Record<string, string[]>;
}

/**
 * Tokenizer interface for pluggable text processing
 */
export interface Tokenizer {
  /** Convert text to tokens */
  tokenize(text: string): string[];
}

/**
 * Default tokenizer: lowercase, split on whitespace/punctuation
 */
export const defaultTokenizer: Tokenizer = {
  tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\-_.,;:!?'"()[\]{}|\\/<>@#$%^&*+=~`]+/)
      .filter((token) => token.length > 0);
  },
};

/**
 * Stemmed tokenizer: default + Porter stemming (simplified)
 *
 * This is a simplified Porter stemmer that handles common English suffixes.
 * For production use, consider a full Porter or Snowball implementation.
 */
export const stemmedTokenizer: Tokenizer = {
  tokenize(text: string): string[] {
    const tokens = defaultTokenizer.tokenize(text);
    return tokens.map(simpleStem);
  },
};

/**
 * Simplified stemming function for common English suffixes
 */
function simpleStem(word: string): string {
  // Handle common suffixes (simplified Porter-like rules)
  if (word.length < 3) return word;

  // Step 1: Plurals and past tense
  if (word.endsWith("ies") && word.length > 4) {
    return word.slice(0, -3) + "y";
  }
  if (word.endsWith("es") && word.length > 3) {
    if (word.endsWith("sses") || word.endsWith("xes") || word.endsWith("zes")) {
      return word.slice(0, -2);
    }
    if (word.endsWith("shes") || word.endsWith("ches")) {
      return word.slice(0, -2);
    }
    return word.slice(0, -1);
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) {
    return word.slice(0, -1);
  }

  // Step 2: Past tense
  if (word.endsWith("ied") && word.length > 4) {
    return word.slice(0, -3) + "y";
  }
  if (word.endsWith("ed") && word.length > 4) {
    const stem = word.slice(0, -2);
    if (stem.endsWith("e")) return stem;
    return stem;
  }

  // Step 3: -ing
  if (word.endsWith("ing") && word.length > 5) {
    const stem = word.slice(0, -3);
    if (stem.endsWith("e")) return stem;
    return stem;
  }

  // Step 4: Common suffixes
  if (word.endsWith("ational") && word.length > 8) {
    return word.slice(0, -5) + "e";
  }
  if (word.endsWith("tion") && word.length > 5) {
    return word.slice(0, -4) + "te";
  }
  if (word.endsWith("ness") && word.length > 5) {
    return word.slice(0, -4);
  }
  if (word.endsWith("ment") && word.length > 5) {
    return word.slice(0, -4);
  }
  if (word.endsWith("able") && word.length > 5) {
    return word.slice(0, -4);
  }
  if (word.endsWith("ible") && word.length > 5) {
    return word.slice(0, -4);
  }
  if (word.endsWith("ful") && word.length > 4) {
    return word.slice(0, -3);
  }
  if (word.endsWith("ous") && word.length > 4) {
    return word.slice(0, -3);
  }
  if (word.endsWith("ive") && word.length > 4) {
    return word.slice(0, -3);
  }
  if (word.endsWith("ly") && word.length > 4) {
    return word.slice(0, -2);
  }

  return word;
}

/**
 * Internal document representation
 */
interface IndexedDocument {
  id: string;
  fieldTokens: Map<string, string[]>;
  fieldLengths: Map<string, number>;
}

/**
 * Term statistics for IDF calculation
 */
interface TermStats {
  /** Number of documents containing this term */
  documentFrequency: number;
  /** Postings: document ID -> field -> term frequency */
  postings: Map<string, Map<string, number>>;
}

/**
 * BM25 Search Index
 *
 * Provides relevance-ranked full-text search with:
 * - Field-level boosting
 * - Configurable tokenization
 * - Incremental add/remove/update
 *
 * @example
 * ```typescript
 * const index = new BM25Index();
 * index.defineField("title", { boost: 2.0 });
 * index.defineField("description", { boost: 1.0 });
 *
 * index.addDocument({
 *   id: "1",
 *   fields: {
 *     title: "Blue Running Shoes",
 *     description: "Lightweight athletic shoes for running"
 *   }
 * });
 *
 * const results = index.search("running shoes");
 * // [{ id: "1", score: 2.45, matches: { title: ["running", "shoes"], description: ["running", "shoes"] } }]
 * ```
 */
export class BM25Index {
  private readonly k1: number;
  private readonly b: number;
  private readonly tokenizer: Tokenizer;

  private readonly fieldConfigs: Map<string, FieldConfig> = new Map();
  private readonly documents: Map<string, IndexedDocument> = new Map();
  private readonly terms: Map<string, TermStats> = new Map();

  // Cached statistics
  private totalFieldLengths: Map<string, number> = new Map();

  /**
   * Create a new BM25 index
   *
   * @param options BM25 configuration
   * @param tokenizer Tokenizer to use (default: defaultTokenizer)
   */
  constructor(options?: BM25Options, tokenizer: Tokenizer = defaultTokenizer) {
    this.k1 = options?.k1 ?? 1.2;
    this.b = options?.b ?? 0.75;
    this.tokenizer = tokenizer;
  }

  /**
   * Define a searchable field with optional boost
   *
   * @param name Field name
   * @param config Field configuration
   */
  defineField(name: string, config?: FieldConfig): void {
    this.fieldConfigs.set(name, { boost: config?.boost ?? 1.0 });
    this.totalFieldLengths.set(name, 0);
  }

  /**
   * Add a document to the index
   *
   * @param doc Document to add
   */
  addDocument(doc: Document): void {
    // Remove existing document with same ID
    if (this.documents.has(doc.id)) {
      this.removeDocument(doc.id);
    }

    const fieldTokens = new Map<string, string[]>();
    const fieldLengths = new Map<string, number>();

    // Process each defined field
    for (const [fieldName] of this.fieldConfigs) {
      const text = doc.fields[fieldName] ?? "";
      const tokens = this.tokenizer.tokenize(text);

      fieldTokens.set(fieldName, tokens);
      fieldLengths.set(fieldName, tokens.length);

      // Update total field length
      const currentTotal = this.totalFieldLengths.get(fieldName) ?? 0;
      this.totalFieldLengths.set(fieldName, currentTotal + tokens.length);

      // Build term frequency map for this field
      const termFreq = new Map<string, number>();
      for (const token of tokens) {
        termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
      }

      // Update term index
      for (const [term, freq] of termFreq) {
        let termStats = this.terms.get(term);
        if (!termStats) {
          termStats = { documentFrequency: 0, postings: new Map() };
          this.terms.set(term, termStats);
        }

        let docPostings = termStats.postings.get(doc.id);
        if (!docPostings) {
          docPostings = new Map();
          termStats.postings.set(doc.id, docPostings);
          termStats.documentFrequency++;
        }

        docPostings.set(fieldName, freq);
      }
    }

    this.documents.set(doc.id, {
      id: doc.id,
      fieldTokens,
      fieldLengths,
    });
  }

  /**
   * Remove a document from the index
   *
   * @param id Document ID to remove
   */
  removeDocument(id: string): void {
    const doc = this.documents.get(id);
    if (!doc) return;

    // Update total field lengths
    for (const [fieldName, length] of doc.fieldLengths) {
      const currentTotal = this.totalFieldLengths.get(fieldName) ?? 0;
      this.totalFieldLengths.set(fieldName, currentTotal - length);
    }

    // Remove from term index
    for (const [term, termStats] of this.terms) {
      if (termStats.postings.has(id)) {
        termStats.postings.delete(id);
        termStats.documentFrequency--;

        // Clean up empty terms
        if (termStats.documentFrequency === 0) {
          this.terms.delete(term);
        }
      }
    }

    this.documents.delete(id);
  }

  /**
   * Update a document in the index
   *
   * @param doc Updated document
   */
  updateDocument(doc: Document): void {
    this.removeDocument(doc.id);
    this.addDocument(doc);
  }

  /**
   * Search the index
   *
   * @param query Search query
   * @param limit Maximum results to return (default: 10)
   * @returns Ranked search results
   */
  search(query: string, limit: number = 10): SearchResult[] {
    const queryTokens = this.tokenizer.tokenize(query);
    if (queryTokens.length === 0) {
      return [];
    }

    const n = this.documents.size;
    if (n === 0) {
      return [];
    }

    const scores = new Map<string, number>();
    const matches = new Map<string, Map<string, Set<string>>>();

    // Calculate average field lengths
    const avgFieldLengths = new Map<string, number>();
    for (const [fieldName, totalLength] of this.totalFieldLengths) {
      avgFieldLengths.set(fieldName, n > 0 ? totalLength / n : 0);
    }

    // Score each query term
    for (const queryTerm of queryTokens) {
      const termStats = this.terms.get(queryTerm);
      if (!termStats) continue;

      // Calculate IDF: log((N - df + 0.5) / (df + 0.5))
      const df = termStats.documentFrequency;
      const idf = Math.log((n - df + 0.5) / (df + 0.5) + 1);

      // Score each document containing this term
      for (const [docId, fieldFreqs] of termStats.postings) {
        const doc = this.documents.get(docId);
        if (!doc) continue;

        let docScore = 0;

        for (const [fieldName, tf] of fieldFreqs) {
          const fieldConfig = this.fieldConfigs.get(fieldName);
          if (!fieldConfig) continue;

          const boost = fieldConfig.boost ?? 1.0;
          const fieldLength = doc.fieldLengths.get(fieldName) ?? 0;
          const avgLength = avgFieldLengths.get(fieldName) ?? 1;

          // BM25 term score: IDF * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl/avgdl))
          const lengthNorm = 1 - this.b + this.b * (fieldLength / avgLength);
          const tfNorm = (tf * (this.k1 + 1)) / (tf + this.k1 * lengthNorm);
          const termScore = idf * tfNorm * boost;

          docScore += termScore;

          // Track matches
          let docMatches = matches.get(docId);
          if (!docMatches) {
            docMatches = new Map();
            matches.set(docId, docMatches);
          }
          let fieldMatches = docMatches.get(fieldName);
          if (!fieldMatches) {
            fieldMatches = new Set();
            docMatches.set(fieldName, fieldMatches);
          }
          fieldMatches.add(queryTerm);
        }

        scores.set(docId, (scores.get(docId) ?? 0) + docScore);
      }
    }

    // Sort by score and return top results
    const results: SearchResult[] = [];
    for (const [docId, score] of scores) {
      const docMatches = matches.get(docId);
      const matchRecord: Record<string, string[]> = {};

      if (docMatches) {
        for (const [fieldName, terms] of docMatches) {
          matchRecord[fieldName] = Array.from(terms);
        }
      }

      results.push({ id: docId, score, matches: matchRecord });
    }

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  /**
   * Number of documents in the index
   */
  get documentCount(): number {
    return this.documents.size;
  }

  /**
   * Average document length per field
   */
  get averageDocumentLength(): Record<string, number> {
    const result: Record<string, number> = {};
    const n = this.documents.size;

    for (const [fieldName, totalLength] of this.totalFieldLengths) {
      result[fieldName] = n > 0 ? totalLength / n : 0;
    }

    return result;
  }

  /**
   * Get all unique terms in the index
   */
  get termCount(): number {
    return this.terms.size;
  }

  /**
   * Serialize the index to a Uint8Array
   *
   * Format: JSON encoded as UTF-8
   */
  serialize(): Uint8Array {
    const data = {
      k1: this.k1,
      b: this.b,
      fieldConfigs: Array.from(this.fieldConfigs.entries()),
      documents: Array.from(this.documents.entries()).map(([id, doc]) => ({
        id,
        fieldTokens: Array.from(doc.fieldTokens.entries()),
        fieldLengths: Array.from(doc.fieldLengths.entries()),
      })),
      terms: Array.from(this.terms.entries()).map(([term, stats]) => ({
        term,
        documentFrequency: stats.documentFrequency,
        postings: Array.from(stats.postings.entries()).map(
          ([docId, fields]) => ({
            docId,
            fields: Array.from(fields.entries()),
          })
        ),
      })),
      totalFieldLengths: Array.from(this.totalFieldLengths.entries()),
    };

    const json = JSON.stringify(data);
    return new TextEncoder().encode(json);
  }

  /**
   * Deserialize an index from a Uint8Array
   *
   * @param data Serialized data from serialize()
   * @param tokenizer Tokenizer to use (must match the one used during indexing)
   */
  static deserialize(
    data: Uint8Array,
    tokenizer: Tokenizer = defaultTokenizer
  ): BM25Index {
    const json = new TextDecoder().decode(data);
    const parsed = JSON.parse(json);

    const index = new BM25Index({ k1: parsed.k1, b: parsed.b }, tokenizer);

    // Restore field configs
    for (const [name, config] of parsed.fieldConfigs) {
      index.fieldConfigs.set(name, config);
    }

    // Restore total field lengths
    for (const [name, length] of parsed.totalFieldLengths) {
      index.totalFieldLengths.set(name, length);
    }

    // Restore documents
    for (const doc of parsed.documents) {
      const fieldTokens = new Map<string, string[]>();
      const fieldLengths = new Map<string, number>();

      for (const [field, tokens] of doc.fieldTokens) {
        fieldTokens.set(field, tokens);
      }
      for (const [field, length] of doc.fieldLengths) {
        fieldLengths.set(field, length);
      }

      index.documents.set(doc.id, {
        id: doc.id,
        fieldTokens,
        fieldLengths,
      });
    }

    // Restore term index
    for (const termData of parsed.terms) {
      const postings = new Map<string, Map<string, number>>();

      for (const posting of termData.postings) {
        const fieldMap = new Map<string, number>();
        for (const [field, freq] of posting.fields) {
          fieldMap.set(field, freq);
        }
        postings.set(posting.docId, fieldMap);
      }

      index.terms.set(termData.term, {
        documentFrequency: termData.documentFrequency,
        postings,
      });
    }

    return index;
  }
}

import {
  BKTree,
  damerauLevenshtein,
  findCandidates,
  levenshtein,
  ngrams,
  ngramSimilarity,
  normalizedDistance,
  similarity,
} from "../../../src/math/search/edit-distance";

describe("levenshtein", () => {
  describe("basic cases", () => {
    it("returns 0 for identical strings", () => {
      expect(levenshtein("abc", "abc")).toBe(0);
      expect(levenshtein("", "")).toBe(0);
      expect(levenshtein("hello world", "hello world")).toBe(0);
    });

    it("returns length for empty string comparison", () => {
      expect(levenshtein("", "abc")).toBe(3);
      expect(levenshtein("abc", "")).toBe(3);
      expect(levenshtein("", "")).toBe(0);
    });

    it("calculates single character edits", () => {
      // Substitution
      expect(levenshtein("cat", "bat")).toBe(1);
      // Insertion
      expect(levenshtein("cat", "cats")).toBe(1);
      // Deletion
      expect(levenshtein("cats", "cat")).toBe(1);
    });
  });

  describe("known examples", () => {
    it("kitten → sitting = 3", () => {
      expect(levenshtein("kitten", "sitting")).toBe(3);
    });

    it("Saturday → Sunday = 3", () => {
      expect(levenshtein("Saturday", "Sunday")).toBe(3);
    });

    it("book → back = 2", () => {
      expect(levenshtein("book", "back")).toBe(2);
    });

    it("intention → execution = 5", () => {
      expect(levenshtein("intention", "execution")).toBe(5);
    });
  });

  describe("symmetry", () => {
    it("is symmetric", () => {
      expect(levenshtein("abc", "def")).toBe(levenshtein("def", "abc"));
      expect(levenshtein("hello", "hallo")).toBe(levenshtein("hallo", "hello"));
      expect(levenshtein("kitten", "sitting")).toBe(
        levenshtein("sitting", "kitten")
      );
    });
  });

  describe("edge cases", () => {
    it("handles single characters", () => {
      expect(levenshtein("a", "b")).toBe(1);
      expect(levenshtein("a", "a")).toBe(0);
      expect(levenshtein("a", "")).toBe(1);
    });

    it("handles repeated characters", () => {
      expect(levenshtein("aaa", "aaaa")).toBe(1);
      expect(levenshtein("aaa", "aab")).toBe(1);
    });

    it("handles unicode", () => {
      expect(levenshtein("café", "cafe")).toBe(1);
      expect(levenshtein("日本", "日本語")).toBe(1);
    });
  });
});

describe("damerauLevenshtein", () => {
  describe("transpositions", () => {
    it("counts transposition as single edit", () => {
      expect(damerauLevenshtein("ab", "ba")).toBe(1);
      expect(damerauLevenshtein("teh", "the")).toBe(1);
      expect(damerauLevenshtein("recieve", "receive")).toBe(1);
    });

    it("handles multiple transpositions", () => {
      expect(damerauLevenshtein("abcd", "badc")).toBe(2);
    });
  });

  describe("vs Levenshtein", () => {
    it("matches Levenshtein when no transpositions possible", () => {
      expect(damerauLevenshtein("abc", "def")).toBe(levenshtein("abc", "def"));
      expect(damerauLevenshtein("kitten", "sitting")).toBe(
        levenshtein("kitten", "sitting")
      );
    });

    it("is less or equal to Levenshtein", () => {
      const pairs = [
        ["ab", "ba"],
        ["teh", "the"],
        ["abcd", "dcba"],
        ["test", "tset"],
      ];

      for (const [a, b] of pairs) {
        expect(damerauLevenshtein(a, b)).toBeLessThanOrEqual(levenshtein(a, b));
      }
    });
  });

  describe("edge cases", () => {
    it("handles empty strings", () => {
      expect(damerauLevenshtein("", "")).toBe(0);
      expect(damerauLevenshtein("abc", "")).toBe(3);
      expect(damerauLevenshtein("", "abc")).toBe(3);
    });

    it("handles single characters", () => {
      expect(damerauLevenshtein("a", "b")).toBe(1);
      expect(damerauLevenshtein("a", "a")).toBe(0);
    });
  });
});

describe("normalizedDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(normalizedDistance("abc", "abc")).toBe(0);
    expect(normalizedDistance("hello", "hello")).toBe(0);
  });

  it("returns 1 for completely different strings of same length", () => {
    expect(normalizedDistance("abc", "xyz")).toBe(1);
  });

  it("returns value between 0 and 1", () => {
    const dist = normalizedDistance("hello", "hallo");
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(1);
    expect(dist).toBeCloseTo(0.2, 5);
  });

  it("handles empty strings", () => {
    expect(normalizedDistance("", "")).toBe(0);
    expect(normalizedDistance("abc", "")).toBe(1);
    expect(normalizedDistance("", "abc")).toBe(1);
  });

  it("uses Damerau-Levenshtein when specified", () => {
    const lev = normalizedDistance("ab", "ba", false);
    const dam = normalizedDistance("ab", "ba", true);
    expect(dam).toBeLessThanOrEqual(lev);
  });
});

describe("similarity", () => {
  it("returns 1 for identical strings", () => {
    expect(similarity("abc", "abc")).toBe(1);
    expect(similarity("hello", "hello")).toBe(1);
  });

  it("returns 0 for completely different strings", () => {
    expect(similarity("abc", "xyz")).toBe(0);
  });

  it("is complement of normalized distance", () => {
    const dist = normalizedDistance("hello", "hallo");
    const sim = similarity("hello", "hallo");
    expect(sim + dist).toBeCloseTo(1, 10);
  });

  it("returns higher values for more similar strings", () => {
    const sim1 = similarity("hello", "hallo"); // 1 edit
    const sim2 = similarity("hello", "hxllo"); // 1 edit
    const sim3 = similarity("hello", "world"); // 4 edits

    expect(sim1).toBeCloseTo(sim2, 5);
    expect(sim1).toBeGreaterThan(sim3);
  });
});

describe("BKTree", () => {
  describe("basic operations", () => {
    it("starts empty", () => {
      const tree = new BKTree();
      expect(tree.size).toBe(0);
    });

    it("adds words", () => {
      const tree = new BKTree();
      tree.add("hello");
      tree.add("world");
      expect(tree.size).toBe(2);
    });

    it("ignores duplicates", () => {
      const tree = new BKTree();
      tree.add("hello");
      tree.add("hello");
      expect(tree.size).toBe(1);
    });

    it("adds multiple words at once", () => {
      const tree = new BKTree();
      tree.addAll(["a", "b", "c", "d"]);
      expect(tree.size).toBe(4);
    });
  });

  describe("contains", () => {
    it("returns true for existing words", () => {
      const tree = new BKTree();
      tree.addAll(["book", "cook", "look"]);

      expect(tree.contains("book")).toBe(true);
      expect(tree.contains("cook")).toBe(true);
      expect(tree.contains("look")).toBe(true);
    });

    it("returns false for non-existing words", () => {
      const tree = new BKTree();
      tree.addAll(["book", "cook", "look"]);

      expect(tree.contains("hook")).toBe(false);
      expect(tree.contains("books")).toBe(false);
    });

    it("returns false for empty tree", () => {
      const tree = new BKTree();
      expect(tree.contains("hello")).toBe(false);
    });
  });

  describe("search", () => {
    it("finds exact matches at distance 0", () => {
      const tree = new BKTree();
      tree.addAll(["book", "cook", "look", "hook"]);

      const results = tree.search("book", 0);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ word: "book", distance: 0 });
    });

    it("finds matches within distance 1", () => {
      const tree = new BKTree();
      tree.addAll(["book", "cook", "look", "hook", "took", "apple"]);

      const results = tree.search("book", 1);

      expect(results).toHaveLength(5);
      expect(results.map((r) => r.word)).toContain("book");
      expect(results.map((r) => r.word)).toContain("cook");
      expect(results.map((r) => r.word)).toContain("look");
      expect(results.map((r) => r.word)).toContain("hook");
      expect(results.map((r) => r.word)).toContain("took");
      expect(results.map((r) => r.word)).not.toContain("apple");
    });

    it("returns results sorted by distance", () => {
      const tree = new BKTree();
      tree.addAll(["book", "books", "cook", "booking"]);

      const results = tree.search("book", 3);

      // Should be sorted by distance
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distance).toBeGreaterThanOrEqual(
          results[i - 1].distance
        );
      }
    });

    it("returns empty for no matches", () => {
      const tree = new BKTree();
      tree.addAll(["apple", "banana", "cherry"]);

      const results = tree.search("xyz", 1);
      expect(results).toHaveLength(0);
    });

    it("returns empty for empty tree", () => {
      const tree = new BKTree();
      const results = tree.search("hello", 2);
      expect(results).toHaveLength(0);
    });
  });

  describe("nearest", () => {
    it("finds exact match", () => {
      const tree = new BKTree();
      tree.addAll(["book", "cook", "look"]);

      const result = tree.nearest("book");
      expect(result).toEqual({ word: "book", distance: 0 });
    });

    it("finds closest match", () => {
      const tree = new BKTree();
      tree.addAll(["book", "cook", "apple", "banana"]);

      const result = tree.nearest("boook");
      expect(result?.word).toBe("book");
      expect(result?.distance).toBe(1);
    });

    it("returns null for empty tree", () => {
      const tree = new BKTree();
      expect(tree.nearest("hello")).toBeNull();
    });

    it("handles completely different words", () => {
      const tree = new BKTree();
      tree.addAll(["apple", "banana"]);

      const result = tree.nearest("xyz");
      expect(result).not.toBeNull();
      // Should return one of the words with some distance
      expect(result!.distance).toBeGreaterThan(0);
    });
  });

  describe("custom distance function", () => {
    it("accepts custom distance function", () => {
      const tree = new BKTree(damerauLevenshtein);
      tree.addAll(["the", "teh", "eth"]);

      // With Damerau, "teh" is distance 1 from "the"
      const results = tree.search("the", 1);
      expect(results.map((r) => r.word)).toContain("teh");
    });
  });

  describe("performance", () => {
    it("handles large datasets", () => {
      const tree = new BKTree();
      const words: string[] = [];

      // Generate 1000 random words
      for (let i = 0; i < 1000; i++) {
        words.push(`word${i}`);
      }
      tree.addAll(words);

      expect(tree.size).toBe(1000);

      // Search should complete quickly
      const start = Date.now();
      const results = tree.search("word500", 2);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100); // Should be fast
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

describe("ngrams", () => {
  describe("basic cases", () => {
    it("generates bigrams by default", () => {
      expect(ngrams("hello")).toEqual(["he", "el", "ll", "lo"]);
    });

    it("generates trigrams", () => {
      expect(ngrams("hello", 3)).toEqual(["hel", "ell", "llo"]);
    });

    it("generates single n-gram when string equals n", () => {
      expect(ngrams("abc", 3)).toEqual(["abc"]);
    });

    it("returns empty for string shorter than n", () => {
      expect(ngrams("ab", 3)).toEqual([]);
      expect(ngrams("a", 2)).toEqual([]);
    });

    it("returns empty for empty string", () => {
      expect(ngrams("", 2)).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("handles unigrams", () => {
      expect(ngrams("abc", 1)).toEqual(["a", "b", "c"]);
    });

    it("throws for non-positive n", () => {
      expect(() => ngrams("hello", 0)).toThrow("N must be a positive integer");
      expect(() => ngrams("hello", -1)).toThrow("N must be a positive integer");
    });

    it("throws for non-integer n", () => {
      expect(() => ngrams("hello", 1.5)).toThrow("N must be a positive integer");
    });
  });
});

describe("ngramSimilarity", () => {
  describe("basic cases", () => {
    it("returns 1 for identical strings", () => {
      expect(ngramSimilarity("hello", "hello")).toBe(1);
    });

    it("returns 0 for completely different strings", () => {
      expect(ngramSimilarity("abc", "xyz")).toBe(0);
    });

    it("returns value between 0 and 1 for partial matches", () => {
      const sim = ngramSimilarity("night", "nacht");
      expect(sim).toBeGreaterThan(0);
      expect(sim).toBeLessThan(1);
    });
  });

  describe("edge cases", () => {
    it("handles empty strings", () => {
      expect(ngramSimilarity("", "")).toBe(1);
      expect(ngramSimilarity("abc", "")).toBe(0);
      expect(ngramSimilarity("", "abc")).toBe(0);
    });

    it("handles strings shorter than n", () => {
      // When both strings are shorter than n, compare equality
      expect(ngramSimilarity("a", "a", 2)).toBe(1);
      expect(ngramSimilarity("a", "b", 2)).toBe(0);
    });

    it("handles different n values", () => {
      const sim2 = ngramSimilarity("hello", "hallo", 2);
      const sim3 = ngramSimilarity("hello", "hallo", 3);

      // Both should be valid similarities
      expect(sim2).toBeGreaterThan(0);
      expect(sim3).toBeGreaterThan(0);
    });
  });

  describe("jaccard coefficient properties", () => {
    it("is symmetric", () => {
      expect(ngramSimilarity("abc", "abd")).toBe(ngramSimilarity("abd", "abc"));
    });

    it("equals 1 only for identical strings", () => {
      expect(ngramSimilarity("abc", "abc")).toBe(1);
      expect(ngramSimilarity("abc", "abcd")).toBeLessThan(1);
    });
  });
});

describe("findCandidates", () => {
  it("filters candidates by n-gram similarity", () => {
    const words = ["book", "cook", "look", "apple", "banana"];
    const candidates = findCandidates("boook", words, 0.3);

    expect(candidates).toContain("book");
    expect(candidates).toContain("cook");
    expect(candidates).toContain("look");
    expect(candidates).not.toContain("apple");
    expect(candidates).not.toContain("banana");
  });

  it("returns empty for no matches above threshold", () => {
    const words = ["apple", "banana", "cherry"];
    const candidates = findCandidates("xyz", words, 0.5);

    expect(candidates).toHaveLength(0);
  });

  it("returns all for low threshold", () => {
    const words = ["a", "b", "c"];
    const candidates = findCandidates("x", words, 0);

    expect(candidates).toHaveLength(3);
  });

  it("respects custom n-gram size", () => {
    const words = ["hello", "hallo", "world"];
    const candidates2 = findCandidates("hello", words, 0.5, 2);
    const candidates3 = findCandidates("hello", words, 0.5, 3);

    // Both should find "hello" as exact match
    expect(candidates2).toContain("hello");
    expect(candidates3).toContain("hello");
  });
});

describe("integration: spell correction workflow", () => {
  it("combines n-gram filtering with BK-Tree search", () => {
    // Dictionary
    const dictionary = [
      "apple",
      "application",
      "apply",
      "banana",
      "band",
      "bandana",
      "book",
      "cook",
      "look",
      "hook",
      "took",
    ];

    // Build BK-Tree
    const tree = new BKTree();
    tree.addAll(dictionary);

    // Misspelled query
    const query = "aple";

    // Step 1: Fast n-gram filtering to reduce candidates
    const candidates = findCandidates(query, dictionary, 0.2);
    expect(candidates.length).toBeLessThan(dictionary.length);
    expect(candidates).toContain("apple");

    // Step 2: Precise edit distance search
    const results = tree.search(query, 2);

    // Should find "apple" with distance 1
    const appleResult = results.find((r) => r.word === "apple");
    expect(appleResult).toBeDefined();
    expect(appleResult!.distance).toBe(1);
  });
});

import {
  BM25Index,
  defaultTokenizer,
  type Document,
  stemmedTokenizer,
} from "../../../src/math/search/bm25";

describe("defaultTokenizer", () => {
  it("converts to lowercase", () => {
    expect(defaultTokenizer.tokenize("Hello World")).toEqual([
      "hello",
      "world",
    ]);
  });

  it("splits on whitespace", () => {
    expect(defaultTokenizer.tokenize("one two three")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("splits on punctuation", () => {
    expect(defaultTokenizer.tokenize("hello, world! how are you?")).toEqual([
      "hello",
      "world",
      "how",
      "are",
      "you",
    ]);
  });

  it("handles hyphens", () => {
    expect(defaultTokenizer.tokenize("e-commerce")).toEqual([
      "e",
      "commerce",
    ]);
  });

  it("filters empty tokens", () => {
    expect(defaultTokenizer.tokenize("  hello   world  ")).toEqual([
      "hello",
      "world",
    ]);
  });

  it("handles empty string", () => {
    expect(defaultTokenizer.tokenize("")).toEqual([]);
  });
});

describe("stemmedTokenizer", () => {
  it("converts to lowercase", () => {
    expect(stemmedTokenizer.tokenize("Hello")).toEqual(["hello"]);
  });

  it("stems plurals", () => {
    expect(stemmedTokenizer.tokenize("shoes")).toContain("shoe");
    expect(stemmedTokenizer.tokenize("boxes")).toContain("box");
    expect(stemmedTokenizer.tokenize("berries")).toContain("berry");
  });

  it("stems past tense", () => {
    expect(stemmedTokenizer.tokenize("walked")).toContain("walk");
    expect(stemmedTokenizer.tokenize("carried")).toContain("carry");
  });

  it("stems -ing", () => {
    expect(stemmedTokenizer.tokenize("running")).toContain("runn");
    expect(stemmedTokenizer.tokenize("walking")).toContain("walk");
  });

  it("stems common suffixes", () => {
    expect(stemmedTokenizer.tokenize("happiness")).toContain("happi");
    expect(stemmedTokenizer.tokenize("careful")).toContain("care");
    expect(stemmedTokenizer.tokenize("quickly")).toContain("quick");
  });
});

describe("BM25Index", () => {
  describe("constructor", () => {
    it("creates with default options", () => {
      const index = new BM25Index();
      expect(index.documentCount).toBe(0);
    });

    it("accepts custom k1 and b parameters", () => {
      const index = new BM25Index({ k1: 1.5, b: 0.5 });
      expect(index.documentCount).toBe(0);
    });

    it("accepts custom tokenizer", () => {
      const index = new BM25Index({}, stemmedTokenizer);
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "walking shoes" } });

      // With stemming, "walked" and "walking" should both stem to "walk"
      const results = index.search("walked");
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("defineField", () => {
    it("defines a field with default boost", () => {
      const index = new BM25Index();
      index.defineField("title");
      expect(index.averageDocumentLength).toHaveProperty("title");
    });

    it("defines a field with custom boost", () => {
      const index = new BM25Index();
      index.defineField("title", { boost: 2.0 });
      expect(index.averageDocumentLength).toHaveProperty("title");
    });
  });

  describe("addDocument", () => {
    it("adds a document", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "hello world" } });

      expect(index.documentCount).toBe(1);
    });

    it("replaces document with same ID", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "hello" } });
      index.addDocument({ id: "1", fields: { text: "world" } });

      expect(index.documentCount).toBe(1);

      // Old content should not be searchable
      expect(index.search("hello").length).toBe(0);
      // New content should be searchable
      expect(index.search("world").length).toBe(1);
    });

    it("handles missing fields", () => {
      const index = new BM25Index();
      index.defineField("title");
      index.defineField("description");
      index.addDocument({ id: "1", fields: { title: "hello" } });

      expect(index.documentCount).toBe(1);
    });

    it("handles multiple documents", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "hello" } });
      index.addDocument({ id: "2", fields: { text: "world" } });
      index.addDocument({ id: "3", fields: { text: "hello world" } });

      expect(index.documentCount).toBe(3);
    });
  });

  describe("removeDocument", () => {
    it("removes a document", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "hello" } });
      index.removeDocument("1");

      expect(index.documentCount).toBe(0);
      expect(index.search("hello").length).toBe(0);
    });

    it("handles non-existent document", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.removeDocument("nonexistent");

      expect(index.documentCount).toBe(0);
    });

    it("updates statistics correctly", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "one two three" } });
      index.addDocument({ id: "2", fields: { text: "four five" } });

      const avgBefore = index.averageDocumentLength["text"];

      index.removeDocument("1");

      const avgAfter = index.averageDocumentLength["text"];
      expect(avgAfter).toBeLessThan(avgBefore);
    });
  });

  describe("updateDocument", () => {
    it("updates document content", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "hello" } });
      index.updateDocument({ id: "1", fields: { text: "world" } });

      expect(index.search("hello").length).toBe(0);
      expect(index.search("world").length).toBe(1);
    });
  });

  describe("search", () => {
    let index: BM25Index;

    beforeEach(() => {
      index = new BM25Index();
      index.defineField("title", { boost: 2.0 });
      index.defineField("description", { boost: 1.0 });

      const documents: Document[] = [
        {
          id: "1",
          fields: {
            title: "Blue Running Shoes",
            description: "Lightweight athletic shoes for running and jogging",
          },
        },
        {
          id: "2",
          fields: {
            title: "Red Dress Shoes",
            description: "Elegant formal shoes for business occasions",
          },
        },
        {
          id: "3",
          fields: {
            title: "Running Shorts",
            description: "Comfortable shorts for running and exercise",
          },
        },
        {
          id: "4",
          fields: {
            title: "Walking Boots",
            description: "Durable boots for hiking and walking",
          },
        },
      ];

      for (const doc of documents) {
        index.addDocument(doc);
      }
    });

    it("returns empty for empty query", () => {
      expect(index.search("").length).toBe(0);
    });

    it("returns empty for no matches", () => {
      expect(index.search("basketball").length).toBe(0);
    });

    it("finds exact matches", () => {
      const results = index.search("running");

      expect(results.length).toBe(2);
      expect(results.map((r) => r.id)).toContain("1");
      expect(results.map((r) => r.id)).toContain("3");
    });

    it("ranks by relevance", () => {
      const results = index.search("running shoes");

      // Doc 1 has both "running" and "shoes" in title and description
      // Doc 2 has only "shoes"
      // Doc 3 has "running" in title but not shoes
      expect(results[0].id).toBe("1");
    });

    it("applies field boost", () => {
      // "shoes" appears in title of docs 1 and 2
      // "shoes" appears in description of docs 1, 2
      const results = index.search("shoes");

      // Documents with "shoes" in title should rank higher
      expect(results.length).toBeGreaterThanOrEqual(2);
      // Both docs 1 and 2 have "shoes" in title, so they should rank high
      const topIds = results.slice(0, 2).map((r) => r.id);
      expect(topIds).toContain("1");
      expect(topIds).toContain("2");
    });

    it("respects limit parameter", () => {
      const results = index.search("running", 1);
      expect(results.length).toBe(1);
    });

    it("includes match information", () => {
      const results = index.search("running shoes");

      expect(results.length).toBeGreaterThan(0);
      const firstResult = results[0];
      expect(firstResult.matches).toBeDefined();

      // Should have matches in at least one field
      const hasMatches =
        Object.values(firstResult.matches).some((terms) => terms.length > 0);
      expect(hasMatches).toBe(true);
    });

    it("handles multi-word queries", () => {
      const results = index.search("comfortable running shorts");

      expect(results.length).toBeGreaterThan(0);
      // Doc 3 should rank high (has all three terms)
      expect(results[0].id).toBe("3");
    });
  });

  describe("BM25 scoring", () => {
    it("penalizes longer documents", () => {
      const index = new BM25Index();
      index.defineField("text");

      // Short document with "shoes"
      index.addDocument({ id: "short", fields: { text: "running shoes" } });

      // Long document with "shoes" (more diluted)
      index.addDocument({
        id: "long",
        fields: {
          text: "running shoes with extra padding and special features for comfort and durability",
        },
      });

      const results = index.search("shoes");

      // Short document should have higher score due to length normalization
      expect(results[0].id).toBe("short");
    });

    it("rewards term frequency with saturation", () => {
      const index = new BM25Index();
      index.defineField("text");

      // One mention of "shoes"
      index.addDocument({ id: "once", fields: { text: "running shoes" } });

      // Multiple mentions of "shoes"
      index.addDocument({
        id: "multiple",
        fields: { text: "shoes shoes shoes" },
      });

      const results = index.search("shoes");

      // Multiple mentions should rank higher, but with diminishing returns
      expect(results[0].id).toBe("multiple");
    });

    it("uses IDF to downweight common terms", () => {
      const index = new BM25Index();
      index.defineField("text");

      // Add many documents with "the"
      for (let i = 0; i < 10; i++) {
        index.addDocument({ id: `common${i}`, fields: { text: `the item ${i}` } });
      }

      // Add one document with rare term
      index.addDocument({ id: "rare", fields: { text: "unique product" } });

      // "the" is very common, should have low IDF
      const commonResults = index.search("the");
      const rareResults = index.search("unique");

      // Both should return results
      expect(commonResults.length).toBeGreaterThan(0);
      expect(rareResults.length).toBeGreaterThan(0);

      // The rare term match should have higher score
      expect(rareResults[0].score).toBeGreaterThan(commonResults[0].score);
    });
  });

  describe("statistics", () => {
    it("tracks document count", () => {
      const index = new BM25Index();
      index.defineField("text");

      expect(index.documentCount).toBe(0);

      index.addDocument({ id: "1", fields: { text: "hello" } });
      expect(index.documentCount).toBe(1);

      index.addDocument({ id: "2", fields: { text: "world" } });
      expect(index.documentCount).toBe(2);

      index.removeDocument("1");
      expect(index.documentCount).toBe(1);
    });

    it("calculates average document length", () => {
      const index = new BM25Index();
      index.defineField("text");

      index.addDocument({ id: "1", fields: { text: "one two three" } }); // 3 tokens
      index.addDocument({ id: "2", fields: { text: "four five" } }); // 2 tokens

      expect(index.averageDocumentLength["text"]).toBe(2.5);
    });

    it("tracks term count", () => {
      const index = new BM25Index();
      index.defineField("text");

      index.addDocument({ id: "1", fields: { text: "hello world" } });
      expect(index.termCount).toBe(2);

      index.addDocument({ id: "2", fields: { text: "hello there" } });
      expect(index.termCount).toBe(3); // "hello", "world", "there"
    });
  });

  describe("serialization", () => {
    it("round-trips correctly", () => {
      const index = new BM25Index({ k1: 1.5, b: 0.6 });
      index.defineField("title", { boost: 2.0 });
      index.defineField("body", { boost: 1.0 });

      index.addDocument({
        id: "1",
        fields: { title: "Hello World", body: "This is a test" },
      });
      index.addDocument({
        id: "2",
        fields: { title: "Goodbye World", body: "Another document" },
      });

      const serialized = index.serialize();
      const restored = BM25Index.deserialize(serialized);

      expect(restored.documentCount).toBe(2);

      // Search should work the same
      const originalResults = index.search("world");
      const restoredResults = restored.search("world");

      expect(restoredResults.length).toBe(originalResults.length);
      expect(restoredResults.map((r) => r.id)).toEqual(
        originalResults.map((r) => r.id)
      );
    });

    it("preserves scores after restoration", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "hello world" } });
      index.addDocument({ id: "2", fields: { text: "hello there" } });

      const serialized = index.serialize();
      const restored = BM25Index.deserialize(serialized);

      const originalResults = index.search("hello");
      const restoredResults = restored.search("hello");

      for (let i = 0; i < originalResults.length; i++) {
        expect(restoredResults[i].score).toBeCloseTo(originalResults[i].score, 5);
      }
    });
  });

  describe("edge cases", () => {
    it("handles empty index search", () => {
      const index = new BM25Index();
      index.defineField("text");

      expect(index.search("hello")).toEqual([]);
    });

    it("handles documents with only undefined fields", () => {
      const index = new BM25Index();
      index.defineField("title");
      index.addDocument({ id: "1", fields: {} });

      expect(index.documentCount).toBe(1);
      expect(index.search("anything")).toEqual([]);
    });

    it("handles special characters in text", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({
        id: "1",
        fields: { text: "C++ programming & JavaScript" },
      });

      const results = index.search("javascript");
      expect(results.length).toBe(1);
    });

    it("handles unicode text", () => {
      const index = new BM25Index();
      index.defineField("text");
      index.addDocument({ id: "1", fields: { text: "日本語 テスト" } });
      index.addDocument({ id: "2", fields: { text: "café résumé" } });

      expect(index.search("日本語").length).toBe(1);
      expect(index.search("café").length).toBe(1);
    });

    it("handles very long documents", () => {
      const index = new BM25Index();
      index.defineField("text");

      const longText = "word ".repeat(10000);
      index.addDocument({ id: "1", fields: { text: longText } });

      expect(index.documentCount).toBe(1);
      const results = index.search("word");
      expect(results.length).toBe(1);
    });
  });

  describe("performance", () => {
    it("handles many documents", () => {
      const index = new BM25Index();
      index.defineField("title");
      index.defineField("body");

      // Add 1000 documents
      for (let i = 0; i < 1000; i++) {
        index.addDocument({
          id: `doc${i}`,
          fields: {
            title: `Product ${i}`,
            body: `Description for product ${i} with some extra words`,
          },
        });
      }

      expect(index.documentCount).toBe(1000);

      // Search should be fast
      const start = Date.now();
      const results = index.search("product description", 10);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(100); // Should complete in under 100ms
      expect(results.length).toBe(10);
    });
  });
});

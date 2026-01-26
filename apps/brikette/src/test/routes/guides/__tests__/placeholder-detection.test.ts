import {
  filterPlaceholders,
  isPlaceholderString,
  PLACEHOLDER_PHRASES,
} from "@/routes/guides/guide-seo/content-detection/placeholders";

describe("isPlaceholderString", () => {
  describe("detects empty/undefined values", () => {
    it("returns true for undefined", () => {
      expect(isPlaceholderString(undefined, "test.key")).toBe(true);
    });

    it("returns true for empty string", () => {
      expect(isPlaceholderString("", "test.key")).toBe(true);
    });

    it("returns true for whitespace-only string", () => {
      expect(isPlaceholderString("   ", "test.key")).toBe(true);
    });
  });

  describe("detects key-based placeholders", () => {
    it("returns true when value matches key exactly", () => {
      expect(isPlaceholderString("test.key", "test.key")).toBe(true);
    });

    it("returns true when value starts with key followed by dot", () => {
      expect(isPlaceholderString("test.key.subkey", "test.key")).toBe(true);
    });
  });

  describe("detects locale-specific placeholder phrases", () => {
    it("detects Italian placeholder", () => {
      expect(isPlaceholderString("Traduzione in arrivo.", "test")).toBe(true);
      expect(isPlaceholderString("traduzione in arrivo", "test")).toBe(true);
    });

    it("detects Polish placeholder", () => {
      expect(isPlaceholderString("Tłumaczenie w przygotowaniu.", "test")).toBe(true);
      expect(isPlaceholderString("tłumaczenie w przygotowaniu", "test")).toBe(true);
    });

    it("detects Hungarian placeholder", () => {
      expect(isPlaceholderString("A fordítás folyamatban van.", "test")).toBe(true);
      expect(isPlaceholderString("a fordítás folyamatban van", "test")).toBe(true);
    });

    it("detects English placeholder", () => {
      expect(isPlaceholderString("Translation in progress.", "test")).toBe(true);
      expect(isPlaceholderString("translation in progress", "test")).toBe(true);
    });

    it("detects Spanish placeholder", () => {
      expect(isPlaceholderString("Traducción en progreso.", "test")).toBe(true);
    });

    it("detects French placeholder", () => {
      expect(isPlaceholderString("Traduction en cours.", "test")).toBe(true);
    });

    it("detects German placeholder", () => {
      expect(isPlaceholderString("Übersetzung in Arbeit.", "test")).toBe(true);
    });

    it("detects Japanese placeholder", () => {
      expect(isPlaceholderString("翻訳準備中", "test")).toBe(true);
    });

    it("detects Korean placeholder", () => {
      expect(isPlaceholderString("번역 준비 중", "test")).toBe(true);
    });

    it("detects Chinese placeholder", () => {
      expect(isPlaceholderString("翻译进行中", "test")).toBe(true);
    });

    it("detects Portuguese placeholder", () => {
      expect(isPlaceholderString("Tradução em andamento.", "test")).toBe(true);
    });

    it("detects Russian placeholder", () => {
      expect(isPlaceholderString("Перевод в процессе.", "test")).toBe(true);
    });

    it("handles trailing punctuation variations", () => {
      expect(isPlaceholderString("Traduzione in arrivo!", "test")).toBe(true);
      expect(isPlaceholderString("Traduzione in arrivo?", "test")).toBe(true);
      expect(isPlaceholderString("Traduzione in arrivo…", "test")).toBe(true);
    });
  });

  describe("does not detect real content", () => {
    it("returns false for meaningful English content", () => {
      expect(isPlaceholderString("This is real content about travel.", "test")).toBe(false);
    });

    it("returns false for meaningful Italian content", () => {
      expect(isPlaceholderString("Benvenuti a Positano, una bella città.", "test")).toBe(false);
    });

    it("returns false for meaningful Polish content", () => {
      expect(isPlaceholderString("Witamy w Positano, pięknym mieście.", "test")).toBe(false);
    });

    it("returns false for content containing placeholder phrase as substring", () => {
      expect(
        isPlaceholderString("The translation in progress is almost complete.", "test"),
      ).toBe(false);
    });
  });
});

describe("filterPlaceholders", () => {
  it("removes placeholder strings from array", () => {
    const input = [
      "Real content here",
      "Traduzione in arrivo.",
      "More real content",
      "Tłumaczenie w przygotowaniu.",
      "",
    ];
    const result = filterPlaceholders(input, "test");
    expect(result).toEqual(["Real content here", "More real content"]);
  });

  it("returns empty array when all items are placeholders", () => {
    const input = ["Traduzione in arrivo.", "Translation in progress.", ""];
    const result = filterPlaceholders(input, "test");
    expect(result).toEqual([]);
  });

  it("preserves real content", () => {
    const input = ["First paragraph.", "Second paragraph.", "Third paragraph."];
    const result = filterPlaceholders(input, "test");
    expect(result).toEqual(["First paragraph.", "Second paragraph.", "Third paragraph."]);
  });
});

describe("PLACEHOLDER_PHRASES", () => {
  it("exports the placeholder phrases array", () => {
    expect(Array.isArray(PLACEHOLDER_PHRASES)).toBe(true);
    expect(PLACEHOLDER_PHRASES.length).toBeGreaterThan(0);
  });

  it("includes all major locale placeholders", () => {
    expect(PLACEHOLDER_PHRASES).toContain("traduzione in arrivo");
    expect(PLACEHOLDER_PHRASES).toContain("tłumaczenie w przygotowaniu");
    expect(PLACEHOLDER_PHRASES).toContain("a fordítás folyamatban van");
  });
});

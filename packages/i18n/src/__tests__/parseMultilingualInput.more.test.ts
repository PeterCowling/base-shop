import normalizeMultilingualInput, {
  parseMultilingualInput,
} from "../parseMultilingualInput";

describe("parseMultilingualInput additional cases", () => {
  const locales = ["en", "it"] as const;

  it("maps object keys and detects locales", () => {
    const obj = { title_en: "Hi", title_it: "Ciao" };
    for (const key of Object.keys(obj)) {
      const parsed = parseMultilingualInput(key, locales);
      expect(parsed).toEqual({ field: "title", locale: key.endsWith("_en") ? "en" : "it" });
    }
  });

  it("returns null when locale suffix not in target array", () => {
    const partialLocales = ["en"] as const;
    expect(parseMultilingualInput("title_it", partialLocales)).toBeNull();
  });

  it("returns null for non-string names and extra spaces", () => {
    expect(parseMultilingualInput(123 as any, locales)).toBeNull();
    expect(parseMultilingualInput(" title_en", locales)).toBeNull();
    expect(parseMultilingualInput("title_it ", locales)).toBeNull();
  });

  it("rejects malformed strings", () => {
    const bad = ["title-", "desc__en", "desc_en_extra"];
    for (const name of bad) {
      expect(parseMultilingualInput(name, locales)).toBeNull();
    }
  });
});

describe("normalizeMultilingualInput edge cases", () => {
  const locales = ["en", "it"] as const;

  it("populates the first locale from a plain string", () => {
    expect(normalizeMultilingualInput(" Hello ", locales)).toEqual({
      en: "Hello",
    });
  });

  it("trims values and drops empty or unknown locales", () => {
    const input = { en: " Hi ", it: "  ", fr: "Bonjour", de: 1 as any };
    expect(normalizeMultilingualInput(input, locales)).toEqual({ en: "Hi" });
  });
});

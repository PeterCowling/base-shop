import { describe, expect, it } from "vitest";
import { slugify, slugifyWithFallback } from "@/utils/slugify";

describe("slugify", () => {
  it("removes diacritics and replaces ampersands", () => {
    expect(slugify("Ändern & Stornieren")).toBe("andern-und-stornieren");
  });

  it("normalizes dashes and trims whitespace", () => {
    expect(slugify(" Bonjour — café ")).toBe("bonjour-cafe");
  });

  it("replaces underscores and collapses separators", () => {
    expect(slugify("foo__bar   baz--qux")).toBe("foo-bar-baz-qux");
  });

  it("drops non-alphanumerics", () => {
    expect(slugify("100% guaranteed!")).toBe("100-guaranteed");
    expect(slugify("💡 Bright Idea")).toBe("bright-idea");
  });

  it("collapses multiple separators to single hyphen", () => {
    expect(slugify("one___two   —   three")).toBe("one-two-three");
  });

  it("returns lowercase only", () => {
    expect(slugify("CAPITAL Letters")).toBe("capital-letters");
  });

  it("returns empty string for symbol-only input", () => {
    expect(slugify("!!!")).toBe("");
    expect(slugify("💬💬💬")).toBe("");
  });

  it("never includes leading or trailing hyphens", () => {
    expect(slugify("  --Trim-- ")).toBe("trim");
  });
});

describe("slugifyWithFallback", () => {
  it("returns the primary slug when valid", () => {
    expect(slugifyWithFallback("Accès rapide", "quick-access")).toBe("acces-rapide");
  });

  it("falls back when slug would be empty", () => {
    expect(slugifyWithFallback("💬💬", "chat")).toBe("chat");
  });

  it("slugifies the fallback when needed", () => {
    expect(slugifyWithFallback("🔥", "Super Deal!")).toBe("super-deal");
  });

  it("returns empty string when both label and fallback are invalid", () => {
    expect(slugifyWithFallback("!!!", "###")).toBe("");
  });
});
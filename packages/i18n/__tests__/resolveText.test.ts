import { resolveText } from "../src/resolveText";
import { fallbackChain } from "../src/fallbackChain";
import type { Locale, TranslatableText } from "@acme/types";

const t = (key: string, params?: Record<string, unknown>) => {
  let out = key;
  if (params) {
    out = out + JSON.stringify(params);
  }
  return out;
};

describe("resolveText", () => {
  it("resolves legacy string (inline.en)", () => {
    expect(resolveText("Hello", "en" as Locale, t)).toBe("Hello");
  });

  it("resolves key via t() with params", () => {
    const v: TranslatableText = { type: "key", key: "actions.addToCart", params: { qty: 2 } } as const;
    expect(resolveText(v, "en" as Locale, t)).toContain("actions.addToCart");
    expect(resolveText(v, "en" as Locale, t)).toContain("qty");
  });

  it("resolves inline for current locale", () => {
    const v: TranslatableText = { type: "inline", value: { en: "Hi", de: "Hallo" } } as const;
    expect(resolveText(v, "de" as Locale, t)).toBe("Hallo");
  });

  it("falls back along chain when missing locale", () => {
    const v: TranslatableText = { type: "inline", value: { en: "Hi" } } as const;
    expect(resolveText(v, "de" as Locale, t)).toBe("Hi");
  });

  it("returns empty string when inline missing all fallbacks", () => {
    const v: TranslatableText = { type: "inline", value: {} } as const;
    expect(resolveText(v, "de" as Locale, t)).toBe("");
  });
});

describe("fallbackChain", () => {
  it("returns expected order per locale", () => {
    expect(fallbackChain("en" as Locale)).toEqual(["en"]);
    expect(fallbackChain("de" as Locale)).toEqual(["de", "en"]);
    expect(fallbackChain("it" as Locale)).toEqual(["it", "en"]);
  });
});


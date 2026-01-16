import { describe, expect, it } from "vitest";

import {
  asString,
  extractLanguageFromPath,
  getLocalizedFallback,
  loadLocaleFallbacks,
  resolveFallbackKey,
  type LocaleBundle,
} from "@/utils/localeFallback";

describe("resolveFallbackKey", () => {
  it("navigates nested objects and arrays", () => {
    const bundle: LocaleBundle = {
      hero: {
        title: "Welcome",
        bullets: ["one", "two"],
        nested: [{ label: "first" }, { label: "second" }],
      },
    };

    expect(resolveFallbackKey(bundle, "hero.title")).toBe("Welcome");
    expect(resolveFallbackKey(bundle, "hero.bullets.1")).toBe("two");
    expect(resolveFallbackKey(bundle, "hero.nested.0.label")).toBe("first");
    expect(resolveFallbackKey(bundle, "hero.unknown")).toBeUndefined();
    expect(resolveFallbackKey(bundle, "hero.bullets.not-a-number")).toBeUndefined();
  });
});

describe("asString", () => {
  it("coerces string values and rejects non-strings", () => {
    expect(asString("value")).toBe("value");
    expect(asString(42)).toBeUndefined();
  });
});

describe("extractLanguageFromPath", () => {
  it("extracts supported language codes and skips unsupported ones", () => {
    expect(extractLanguageFromPath("/locales/en/common.json")).toBe("en");
    expect(extractLanguageFromPath("/locales/xx/common.json")).toBeUndefined();
    expect(extractLanguageFromPath("/assets/en/common.json")).toBeUndefined();
  });
});

describe("loadLocaleFallbacks", () => {
  it("builds a language keyed map for valid modules", () => {
    const modules = {
      "/locales/en/common.json": { default: { hero: "en" } },
      "/locales/it/common.json": { default: { hero: "it" } },
      "/locales/xx/common.json": { default: { hero: "xx" } },
    };

    const map = loadLocaleFallbacks(modules);

    expect(map.en).toEqual({ hero: "en" });
    expect(map.it).toEqual({ hero: "it" });
    expect(map.xx).toBeUndefined();
  });

  it("allows custom language extraction logic", () => {
    const modules = {
      "./it.json": { default: { value: "it" } },
    };
    const map = loadLocaleFallbacks(modules, {
      getLanguageFromPath: () => "it",
    });

    expect(map.it).toEqual({ value: "it" });
  });
});

describe("getLocalizedFallback", () => {
  it("returns the first matching string across preferred languages", () => {
    const map = loadLocaleFallbacks({
      "/locales/it/common.json": { default: { hero: { title: "Ciao" } } },
      "/locales/en/common.json": { default: { hero: { title: "Hello" } } },
    });

    expect(
      getLocalizedFallback("it", "hero.title", map, {
        fallbackLanguages: ["en", "fr"],
      }),
    ).toBe("Ciao");

    expect(
      getLocalizedFallback("fr", "hero.title", map, {
        fallbackLanguages: ["it", "en"],
      }),
    ).toBe("Ciao");
  });

  it("deduplicates bundles to avoid infinite loops", () => {
    const sharedBundle = { hero: { title: "Shared" } };
    const map = {
      it: sharedBundle,
      en: sharedBundle,
    };

    expect(getLocalizedFallback("it", "hero.title", map, { fallbackLanguages: ["en"] })).toBe(
      "Shared",
    );
  });

  it("returns undefined when no value can be resolved", () => {
    const map = loadLocaleFallbacks({
      "/locales/en/common.json": { default: { hero: {} } },
    });

    expect(getLocalizedFallback("en", "hero.title", map)).toBeUndefined();
  });
});
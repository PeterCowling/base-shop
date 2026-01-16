import { beforeEach, describe, expect, it, vi } from "vitest";

import appI18n from "@/i18n";

const { preloadNamespacesWithFallback } = vi.hoisted(() => ({
  preloadNamespacesWithFallback: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/utils/loadI18nNs", () => ({
  preloadNamespacesWithFallback,
}));

const { langFromRequest } = vi.hoisted(() => ({
  langFromRequest: vi.fn(),
}));

vi.mock("@/utils/lang", () => ({
  langFromRequest,
}));

const { ensureGuideContent } = vi.hoisted(() => ({
  ensureGuideContent: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/utils/ensureGuideContent", () => ({
  ensureGuideContent,
}));

import { REQUIRED_NAMESPACES } from "./constants";
import { clientLoader } from "./loader";

describe("chiesaNuovaArrivals clientLoader", () => {
  let originalChangeLanguage: typeof appI18n.changeLanguage;

  beforeEach(() => {
    vi.clearAllMocks();
    originalChangeLanguage = appI18n.changeLanguage;
    delete (appI18n as { language?: string }).language;
  });

  afterEach(() => {
    appI18n.changeLanguage = originalChangeLanguage;
    delete (appI18n as { language?: string }).language;
  });

  it("preloads namespaces and changes language when available", async () => {
    langFromRequest.mockReturnValue("it");
    const changeLanguageSpy = vi.fn();
    appI18n.changeLanguage = changeLanguageSpy as typeof appI18n.changeLanguage;

    const result = await clientLoader({ request: new Request("https://example.com") } as any);

    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("it", REQUIRED_NAMESPACES);
    expect(changeLanguageSpy).toHaveBeenCalledWith("it");
    expect(ensureGuideContent).toHaveBeenCalled();
    expect(result).toEqual({ lang: "it" });
  });

  it("falls back to default language and assigns language property when changeLanguage is missing", async () => {
    langFromRequest.mockReturnValue(undefined);
    delete (appI18n as { changeLanguage?: typeof appI18n.changeLanguage }).changeLanguage;

    const result = await clientLoader({ request: new Request("https://example.com") } as any);

    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("en", REQUIRED_NAMESPACES);
    expect((appI18n as { language?: string }).language).toBe("en");
    expect(result).toEqual({ lang: "en" });
  });
});
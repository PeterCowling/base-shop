import { beforeEach, describe, expect, it, vi } from "vitest";

import appI18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { guideSlug } from "@/routes.guides-helpers";
import type { LoaderFunctionArgs } from "react-router-dom";

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

import { GUIDE_KEY, REQUIRED_NAMESPACES } from "./constants";
import { clientLoader, resolveHowToRouteSlug } from "./loader";

describe("ferryDockToBrikette loader", () => {
  const englishSlug = guideSlug("en" as AppLanguage, GUIDE_KEY);
  const swedishSlug = guideSlug("sv" as AppLanguage, GUIDE_KEY);
  let originalChangeLanguage: typeof appI18n.changeLanguage;
  let originalSupportedLngs: typeof i18nConfig.supportedLngs;

  beforeEach(() => {
    vi.clearAllMocks();
    originalChangeLanguage = appI18n.changeLanguage;
    originalSupportedLngs = i18nConfig.supportedLngs;
    delete (appI18n as { language?: string }).language;
    (i18nConfig as { supportedLngs: unknown }).supportedLngs = originalSupportedLngs;
  });

  afterEach(() => {
    appI18n.changeLanguage = originalChangeLanguage;
    (i18nConfig as { supportedLngs: unknown }).supportedLngs = originalSupportedLngs;
    delete (appI18n as { language?: string }).language;
  });

  it("re-exports slug resolution helper", () => {
    const request = new Request("https://example.com/en/how-to-get-here/ferry-dock-to-hostel");

    expect(resolveHowToRouteSlug({ slug: "explicit" }, request, "en" as never)).toBe("explicit");
    expect(resolveHowToRouteSlug({}, request, "en" as never)).toBe("ferry-dock-to-hostel");

    const indexRequest = new Request("https://example.com/en/how-to-get-here/");
    expect(resolveHowToRouteSlug({}, indexRequest, "en" as never)).toBeUndefined();
  });

  it("preloads guide namespaces for locales without a custom slug", async () => {
    langFromRequest.mockReturnValue("de");
    const changeLanguageSpy = vi.fn();
    appI18n.changeLanguage = changeLanguageSpy as typeof appI18n.changeLanguage;

    const request = new Request(`https://example.com/de/how-to-get-here/${englishSlug}`);
    const result = await clientLoader({ params: {}, request } as LoaderFunctionArgs);

    expect(result).toEqual({ lang: "de" });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("de", REQUIRED_NAMESPACES);
    expect(changeLanguageSpy).toHaveBeenCalledWith("de");
    expect(ensureGuideContent).toHaveBeenCalled();
  });

  it("syncs language when a localized slug is used", async () => {
    langFromRequest.mockReturnValue("sv");
    const changeLanguageSpy = vi.fn();
    appI18n.changeLanguage = changeLanguageSpy as typeof appI18n.changeLanguage;

    const request = new Request(`https://example.com/sv/how-to-get-here/${swedishSlug}`);
    const result = await clientLoader({ params: {}, request } as LoaderFunctionArgs);

    expect(result).toEqual({ lang: "sv" });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("sv", REQUIRED_NAMESPACES);
    expect(changeLanguageSpy).toHaveBeenCalledWith("sv");
  });

  it("falls back to setting the language property when changeLanguage is unavailable", async () => {
    langFromRequest.mockReturnValue("it");
    delete (appI18n as { changeLanguage?: typeof appI18n.changeLanguage }).changeLanguage;

    const request = new Request(`https://example.com/it/how-to-get-here/${englishSlug}`);
    const result = await clientLoader({ params: {}, request } as LoaderFunctionArgs);

    expect(result).toEqual({ lang: "it" });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("it", REQUIRED_NAMESPACES);
    expect((appI18n as { language?: string }).language).toBe("it");
  });

  it("throws a 404 response for unknown slugs", async () => {
    langFromRequest.mockReturnValue("en");

    const request = new Request("https://example.com/en/how-to-get-here/not-a-guide");

    await expect(clientLoader({ params: {}, request } as LoaderFunctionArgs)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("defaults to the fallback language when detection fails", async () => {
    langFromRequest.mockReturnValue(undefined);
    const changeLanguageSpy = vi.fn();
    appI18n.changeLanguage = changeLanguageSpy as typeof appI18n.changeLanguage;

    const request = new Request(`https://example.com/en/how-to-get-here/${englishSlug}`);
    const result = await clientLoader({ params: {}, request } as LoaderFunctionArgs);

    expect(result).toEqual({ lang: "en" });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("en", REQUIRED_NAMESPACES);
    expect(changeLanguageSpy).toHaveBeenCalledWith("en");
  });

  it("handles unsupported configured locales by falling back to English", async () => {
    langFromRequest.mockReturnValue("en");
    (i18nConfig as { supportedLngs: unknown }).supportedLngs = "unsupported";
    const changeLanguageSpy = vi.fn();
    appI18n.changeLanguage = changeLanguageSpy as typeof appI18n.changeLanguage;

    const request = new Request(`https://example.com/en/how-to-get-here/${englishSlug}`);
    const result = await clientLoader({ params: {}, request } as LoaderFunctionArgs);

    expect(result).toEqual({ lang: "en" });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("en", REQUIRED_NAMESPACES);
    expect(changeLanguageSpy).toHaveBeenCalledWith("en");
  });
});
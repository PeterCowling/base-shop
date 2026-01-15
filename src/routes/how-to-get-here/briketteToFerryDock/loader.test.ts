import { beforeEach, describe, expect, it, vi } from "vitest";

import appI18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
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
import { clientLoader } from "./loader";

describe("briketteToFerryDock loader", () => {
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

  it("preloads namespaces and syncs the language when the slug is recognised", async () => {
    const lang = "it";
    langFromRequest.mockReturnValue(lang);
    const slug = guideSlug(lang as AppLanguage, GUIDE_KEY);
    const changeLanguageSpy = vi.fn();
    appI18n.changeLanguage = changeLanguageSpy as typeof appI18n.changeLanguage;

    const request = new Request(`https://example.test/${lang}/how-to-get-here/${slug}`);
    const result = await clientLoader({ params: {}, request } as LoaderFunctionArgs);

    expect(result).toEqual({ lang });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith(lang, REQUIRED_NAMESPACES);
    expect(changeLanguageSpy).toHaveBeenCalledWith(lang);
    expect(resolveHowToRouteSlug).toHaveBeenCalled();
  });

  it("throws a 404 response when the slug is missing", async () => {
    langFromRequest.mockReturnValue("es");

    const request = new Request("https://example.test/es/how-to-get-here/unknown-slug");

    await expect(clientLoader({ params: {}, request } as LoaderFunctionArgs)).rejects.toMatchObject({
      status: 404,
    });
    expect(preloadNamespacesWithFallback).not.toHaveBeenCalled();
  });

  it("throws a 404 when no slug can be resolved", async () => {
    langFromRequest.mockReturnValue("fr");

    const request = new Request("https://example.test/fr/how-to-get-here/");

    await expect(clientLoader({ params: {}, request } as LoaderFunctionArgs)).rejects.toMatchObject({
      status: 404,
    });
    expect(preloadNamespacesWithFallback).not.toHaveBeenCalled();
  });

  it("uses the fallback language when detection fails and mutates the i18n instance", async () => {
    langFromRequest.mockReturnValue(undefined);
    resolveHowToRouteSlug.mockImplementation(() => guideSlug("en" as AppLanguage, GUIDE_KEY));
    delete (appI18n as { changeLanguage?: typeof appI18n.changeLanguage }).changeLanguage;

    const request = new Request("https://example.test/how-to-get-here");
    const result = await clientLoader({ params: {}, request } as LoaderFunctionArgs);

    expect(result).toEqual({ lang: "en" });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("en", REQUIRED_NAMESPACES);
    expect((appI18n as { language?: string }).language).toBe("en");
    expect(resolveHowToRouteSlug).toHaveBeenCalled();
  });
});
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LoaderFunctionArgs } from "react-router-dom";

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

import { clientLoader } from "./overview-loader";

describe("overview clientLoader", () => {
  const translateMock = vi.fn((key: string) => key);
  let originalChangeLanguage: typeof appI18n.changeLanguage;
  let originalT: typeof appI18n.t;

  beforeEach(() => {
    vi.clearAllMocks();
    originalChangeLanguage = appI18n.changeLanguage;
    originalT = appI18n.t;
    appI18n.t = translateMock as unknown as typeof appI18n.t;
    translateMock.mockImplementation((key: string) => {
      if (key === "howToGetHere:meta.title") return "Plan your trip";
      if (key === "howToGetHere:meta.description") return "Find the best route";
      return key;
    });
  });

  afterEach(() => {
    appI18n.changeLanguage = originalChangeLanguage;
    appI18n.t = originalT;
  });

  it("preloads namespaces and switches language when the request includes a locale", async () => {
    langFromRequest.mockReturnValue("fr");
    const changeLanguageSpy = vi
      .fn(async () => appI18n.t)
      .mockName("changeLanguageSpy") as unknown as typeof appI18n.changeLanguage;
    appI18n.changeLanguage = changeLanguageSpy;
    const request = new Request("https://example.com/fr/how-to-get-here");

    const result = await clientLoader({
      request,
      params: {},
      context: undefined,
    } satisfies LoaderFunctionArgs);

    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("fr", ["howToGetHere"], { optional: true });
    expect(changeLanguageSpy).toHaveBeenCalledWith("fr");
    expect(result).toMatchObject({
      lang: "fr",
      title: "Plan your trip",
      desc: "Find the best route",
    });
  });

  it("falls back to the default locale and updates the cached language when changeLanguage is unavailable", async () => {
    langFromRequest.mockReturnValue(undefined);
    delete (appI18n as { changeLanguage?: typeof appI18n.changeLanguage }).changeLanguage;
    const request = new Request("https://example.com/it/how-to-get-here");

    const result = await clientLoader({
      request,
      params: {},
      context: undefined,
    } satisfies LoaderFunctionArgs);

    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("en", ["howToGetHere"], { optional: true });
    expect(result).toMatchObject({
      lang: "en",
      title: "Plan your trip",
      desc: "Find the best route",
    });
    expect((appI18n as { language?: string }).language).toBe("en");
  });
});
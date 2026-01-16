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

const { getRouteDefinition } = vi.hoisted(() => ({
  getRouteDefinition: vi.fn(),
}));

vi.mock("@/lib/how-to-get-here/definitions", () => ({
  getRouteDefinition,
}));

const { getContentForRoute } = vi.hoisted(() => ({
  getContentForRoute: vi.fn(),
}));

vi.mock("./content", () => ({
  getContentForRoute,
}));

const { getSlug } = vi.hoisted(() => ({
  getSlug: vi.fn(),
}));

vi.mock("@/utils/slug", () => ({
  getSlug,
}));

const { ensureGuideContent } = vi.hoisted(() => ({
  ensureGuideContent: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/utils/ensureGuideContent", () => ({
  ensureGuideContent,
}));

describe("how-to-get-here loader", () => {
  let originalChangeLanguage: typeof appI18n.changeLanguage;
  let originalTranslate: typeof appI18n.t;

  beforeEach(() => {
    vi.clearAllMocks();
    originalChangeLanguage = appI18n.changeLanguage;
    originalTranslate = appI18n.t;
    appI18n.t = vi.fn((key: string) => key);
    appI18n.changeLanguage = async () => undefined;
    langFromRequest.mockReset();
    getRouteDefinition.mockReset();
    getContentForRoute.mockReset();
    getSlug.mockReset();
  });

  afterEach(() => {
    appI18n.changeLanguage = originalChangeLanguage;
    appI18n.t = originalTranslate;
    delete (appI18n as { language?: string }).language;
  });

  it("resolves the slug from params and request paths", async () => {
    const { resolveHowToRouteSlug } = await import("./loader");

    getSlug.mockReturnValue("how-to-get-here");

    expect(resolveHowToRouteSlug({ slug: "param" }, new Request("https://example.com"), "en" as never)).toBe("param");
    const ferryRequest = new Request("https://example.com/en/how-to-get-here/ferry");
    expect(resolveHowToRouteSlug({}, ferryRequest, "en" as never)).toBe("ferry");
    expect(resolveHowToRouteSlug(undefined, ferryRequest, "en" as never)).toBe("ferry");
    const index = new Request("https://example.com/en/how-to-get-here");
    expect(resolveHowToRouteSlug({}, index, "en" as never)).toBeUndefined();
  });

  it("loads content for a resolved route", async () => {
    langFromRequest.mockReturnValue("it");
    getSlug.mockImplementation((key: string) => {
      if (key === "howToGetHere") return "how-to-get-here";
      if (key === "guides") return "guides";
      return key;
    });
    getRouteDefinition.mockImplementation((slug: string) =>
      slug === "ferry" ? { contentKey: "ferry" } : undefined,
    );
    getContentForRoute.mockResolvedValue({ meta: { title: "", description: "" } });
    const changeLanguageSpy = vi.fn();
    appI18n.changeLanguage = changeLanguageSpy as typeof appI18n.changeLanguage;

    delete (appI18n as { changeLanguage?: typeof appI18n.changeLanguage }).changeLanguage;

    const { clientLoader } = await import("./loader");
    let result;
    try {
      result = await clientLoader({
        params: { slug: "ferry" },
        request: new Request("https://example.com/en/how-to-get-here/ferry"),
      } as LoaderFunctionArgs);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("getRouteDefinition results", getRouteDefinition.mock.results);
      // eslint-disable-next-line no-console
      console.log("loader error stack", (error as Error).stack);
      throw error;
    }

    expect(result).toMatchObject({
      lang: "it",
      slug: "ferry",
      definition: { contentKey: "ferry" },
      howToSlug: "how-to-get-here",
      guidesSlug: "guides",
    });
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("it", expect.arrayContaining(["howToGetHereRoutes"]), {
      optional: true,
    });
    expect(changeLanguageSpy).toHaveBeenCalledWith("it");
    expect(getContentForRoute).toHaveBeenCalledWith("it", "ferry");
  });

  it("uses the fallback language when the request does not provide one", async () => {
    langFromRequest.mockReturnValue(undefined);
    getSlug.mockImplementation((key: string) => {
      if (key === "howToGetHere") return "how-to-get-here";
      if (key === "guides") return "guides";
      return key;
    });
    getRouteDefinition.mockImplementation((slug: string) =>
      slug === "fallback" ? { contentKey: "fallback" } : undefined,
    );
    getContentForRoute.mockResolvedValue({});
    delete (appI18n as { changeLanguage?: typeof appI18n.changeLanguage }).changeLanguage;

    const { clientLoader } = await import("./loader");
    let result;
    try {
      result = await clientLoader({
        params: { slug: "fallback" },
        request: new Request("https://example.com/en/how-to-get-here/fallback"),
      } as LoaderFunctionArgs);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log("fallback definition results", getRouteDefinition.mock.results);
      // eslint-disable-next-line no-console
      console.log("fallback loader error stack", (error as Error).stack);
      throw error;
    }

    expect(result.lang).toBe("en");
    expect(preloadNamespacesWithFallback).toHaveBeenCalledWith("en", expect.any(Array), { optional: true });
    expect((appI18n as { language?: string }).language).toBe("en");
  });

  it("throws a 404 response when the slug cannot be resolved", async () => {
    langFromRequest.mockReturnValue("en");
    getSlug.mockReturnValue("how-to-get-here");

    const { clientLoader } = await import("./loader");
    const request = new Request("https://example.com/en/how-to-get-here");

    await expect(clientLoader({ params: {}, request } as LoaderFunctionArgs)).rejects.toMatchObject({ status: 404 });
  });

  it("throws a 404 response when the route definition is missing", async () => {
    langFromRequest.mockReturnValue("en");
    getSlug.mockImplementation((key: string) => {
      if (key === "howToGetHere") return "how-to-get-here";
      if (key === "guides") return "guides";
      return key;
    });
    getRouteDefinition.mockReturnValue(undefined);

    const { clientLoader } = await import("./loader");

    await expect(
      clientLoader({
        params: { slug: "missing" },
        request: new Request("https://example.com/en/how-to-get-here/missing"),
      } as LoaderFunctionArgs),
    ).rejects.toMatchObject({ status: 404 });
  });
});
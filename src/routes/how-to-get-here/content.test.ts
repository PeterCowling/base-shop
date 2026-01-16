import { beforeEach, describe, expect, it } from "vitest";

import type { RouteContent, RouteContentValue } from "@/lib/how-to-get-here/schema";

import {
  __setSplitRouteModulesForTests,
  __resetHowToGetHereContentCacheForTests,
  getContentForRoute,
} from "./content";

function isRouteContentObject(value: RouteContentValue): value is Record<string, RouteContentValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const CONTENT_KEY = "howToGetHereAmalfiPositanoBus";

type ModuleRecord = Record<string, () => Promise<{ default: RouteContent }>>;

const baseModules: ModuleRecord = {
  "/locales/en/how-to-get-here/routes/howToGetHereAmalfiPositanoBus.json": async () => ({
    default: {
      header: { title: "English header" },
      body: "English body",
      meta: { title: "English meta", description: "English description" },
    },
  }),
};

const applyModules = (modules: ModuleRecord) => {
  __setSplitRouteModulesForTests(modules);
  __resetHowToGetHereContentCacheForTests();
};

describe("how-to-get-here content loader", () => {
  beforeEach(() => {
    applyModules(baseModules);
  });

  it("loads route content for supported locales", async () => {
    const content = await getContentForRoute("en", CONTENT_KEY);

    expect(content).toHaveProperty("header");
    const header = content.header;
    expect(isRouteContentObject(header)).toBe(true);
    if (isRouteContentObject(header) && "title" in header) {
      expect(typeof header.title).toBe("string");
    }
  });

  it("falls back to the default locale when content is missing", async () => {
    const fallbackContent = await getContentForRoute("zz", CONTENT_KEY);
    const englishContent = await getContentForRoute("en", CONTENT_KEY);

    const fallbackHeader = fallbackContent.header;
    const englishHeader = englishContent.header;
    if (
      isRouteContentObject(fallbackHeader) &&
      "title" in fallbackHeader &&
      isRouteContentObject(englishHeader) &&
      "title" in englishHeader
    ) {
      expect(fallbackHeader.title).toBe(englishHeader.title);
    } else {
      throw new Error("Expected headers to be objects with title properties");
    }
  });

  it("throws a 404 Response when the content key cannot be found", async () => {
    await expect(getContentForRoute("en", "missingContentKey")).rejects.toMatchObject({ status: 404 });
  });

  it("prefers locale-specific split content when present", async () => {
    applyModules({
      "/locales/en/how-to-get-here/routes/howToGetHereExample.json": async () => ({
        default: {
          meta: { title: "English title", description: "English description" },
          body: "English body",
        },
      }),
      "/locales/mock/how-to-get-here/routes/howToGetHereExample.json": async () => ({
        default: {
          meta: { title: "Mock title", description: "Mock description" },
          body: "Mock body",
        },
      }),
    });

    const content = await getContentForRoute("mock", "howToGetHereExample");

    expect(content).toMatchObject({
      meta: { title: "Mock title", description: "Mock description" },
      body: "Mock body",
    });
  });

  it("falls back to the default locale when a route key is missing", async () => {
    applyModules({
      "/locales/en/how-to-get-here/routes/howToGetHereExample.json": async () => ({
        default: {
          meta: { title: "English title", description: "English description" },
          body: "English body",
        },
      }),
      "/locales/mock/how-to-get-here/routes/howToGetHereOther.json": async () => ({
        default: {
          meta: { title: "Mock other", description: "Mock other" },
          body: "Mock other body",
        },
      }),
    });

    const fallback = await getContentForRoute("mock", "howToGetHereExample");

    expect(fallback).toMatchObject({
      meta: { title: "English title", description: "English description" },
      body: "English body",
    });
  });

  it("ignores modules that do not match the split content glob", async () => {
    applyModules({
      "/locales/en/how-to-get-here/routes/howToGetHereExample.json": async () => ({
        default: { meta: { title: "Valid" } },
      }),
      "./unexpected/path.json": async () => ({
        default: { meta: { title: "Ignored" } },
      }),
    });

    const content = await getContentForRoute("en", "howToGetHereExample");

    expect(content).toMatchObject({ meta: { title: "Valid" } });
  });

  it("throws a descriptive error when no locale content is registered", async () => {
    applyModules({});

    await expect(getContentForRoute("en", "anything"))
      .rejects.toThrowError(/Missing how-to-get-here locale content/);
  });
});
/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

describe("cms env – pagination and flags", () => {
  const ORIGINAL_ENV = {
    ...process.env,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "production",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  describe("CMS_PAGINATION_LIMIT", () => {
    it("defaults to 100 when unset", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_API_TOKEN: "test-token",
        SANITY_PREVIEW_SECRET: "preview-secret",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(100);
    });

    it("respects overrides", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_API_TOKEN: "test-token",
        SANITY_PREVIEW_SECRET: "preview-secret",
        CMS_PAGINATION_LIMIT: "25",
      } as unknown as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(25);
    });
  });

  describe("CMS feature flags", () => {
    it("are disabled by default with empty path lists", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_API_TOKEN: "test-token",
        SANITY_PREVIEW_SECRET: "preview-secret",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(false);
      expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([]);
      expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(false);
      expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual([]);
    });

    it("parse overrides and disabled-path lists", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_API_TOKEN: "test-token",
        SANITY_PREVIEW_SECRET: "preview-secret",
        CMS_DRAFTS_ENABLED: "true",
        CMS_DRAFTS_DISABLED_PATHS: "/draft1,/draft2",
        CMS_SEARCH_ENABLED: "true",
        CMS_SEARCH_DISABLED_PATHS: "/search1",
      } as unknown as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(true);
      expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([
        "/draft1",
        "/draft2",
      ]);
      expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(true);
      expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["/search1"]);
    });

    it("respect disabled path lists when features are explicitly off", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_API_TOKEN: "test-token",
        SANITY_PREVIEW_SECRET: "preview-secret",
        CMS_DRAFTS_ENABLED: "",
        CMS_DRAFTS_DISABLED_PATHS: "/draft1, /draft2 ,",
        CMS_SEARCH_ENABLED: "",
        CMS_SEARCH_DISABLED_PATHS: "/search1, /search2,",
      } as unknown as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(false);
      expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual(["/draft1", "/draft2"]);
      expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(false);
      expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["/search1", "/search2"]);
    });
  });
});


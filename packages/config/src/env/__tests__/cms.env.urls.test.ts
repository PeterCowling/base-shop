/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

describe("cms env – URLs", () => {
  const ORIGINAL_ENV = {
    ...process.env,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "test-token",
    SANITY_PREVIEW_SECRET: "preview-secret",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  describe("CMS_BASE_URL", () => {
    it("strips trailing slashes from valid URLs", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_BASE_URL: "https://cms.example.com/",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.example.com");
    });

    it("accepts valid URLs without modification", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_BASE_URL: "https://cms.example.com",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.example.com");
    });

    it("rejects invalid URLs", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        CMS_BASE_URL: "not-a-url",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../cms.ts")).rejects.toThrow(
        "Invalid CMS environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          CMS_BASE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });

  describe("SANITY_BASE_URL", () => {
    it("strips trailing slashes", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_BASE_URL: "https://sanity.example.com/",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnv } = await import("../cms.ts");
      expect(cmsEnv.SANITY_BASE_URL).toBe("https://sanity.example.com");
    });

    it("rejects invalid URLs", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://cms.example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2024-01-01",
        SANITY_BASE_URL: "not-a-url",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../cms.ts")).rejects.toThrow(
        "Invalid CMS environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid CMS environment variables:",
        expect.objectContaining({
          SANITY_BASE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
      errorSpy.mockRestore();
    });
  });
});


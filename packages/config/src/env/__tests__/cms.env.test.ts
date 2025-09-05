import { afterEach, describe, expect, it } from "@jest/globals";

const baseEnv = {
  NODE_ENV: "production",
  CMS_SPACE_URL: "https://cms.example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "2024-01-01",
  SANITY_PROJECT_ID: "proj",
  SANITY_DATASET: "dataset",
} as NodeJS.ProcessEnv;

const ORIGINAL_ENV = process.env;

afterEach(() => {
  jest.resetModules();
  process.env = ORIGINAL_ENV;
});

describe("cms sanity env", () => {
  it("defaults CMS vars in development", async () => {
    process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.CMS_SPACE_URL).toBe("https://cms.example.com");
    expect(cmsEnv.CMS_ACCESS_TOKEN).toBe("placeholder-token");
  });

  it("requires CMS vars in production", async () => {
    process.env = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        CMS_ACCESS_TOKEN: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("defaults SANITY fields when missing", async () => {
    process.env = { ...baseEnv };
    delete process.env.SANITY_API_VERSION;
    delete process.env.SANITY_PROJECT_ID;
    delete process.env.SANITY_DATASET;
    delete process.env.SANITY_API_TOKEN;
    delete process.env.SANITY_PREVIEW_SECRET;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv).toMatchObject({
      SANITY_API_VERSION: "2021-10-21",
      SANITY_PROJECT_ID: "dummy-project-id",
      SANITY_DATASET: "production",
      SANITY_API_TOKEN: "dummy-api-token",
      SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    });
  });

  it("defaults SANITY_PROJECT_ID when missing", async () => {
    process.env = { ...baseEnv };
    delete process.env.SANITY_PROJECT_ID;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_PROJECT_ID).toBe("dummy-project-id");
  });

  it("defaults SANITY_DATASET when missing", async () => {
    process.env = { ...baseEnv };
    delete process.env.SANITY_DATASET;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_DATASET).toBe("production");
  });

  it("defaults SANITY_API_TOKEN when missing", async () => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_API_TOKEN).toBe("dummy-api-token");
  });

  it("enables write when SANITY_API_TOKEN provided", async () => {
    process.env = { ...baseEnv, SANITY_API_TOKEN: "tok" };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_API_TOKEN).toBe("tok");
  });

  it("enables preview when SANITY_PREVIEW_SECRET set", async () => {
    process.env = { ...baseEnv, SANITY_PREVIEW_SECRET: "secret" };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("secret");
  });

  it("defaults SANITY_PREVIEW_SECRET when missing", async () => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("dummy-preview-secret");
  });

  it("strips trailing slash from SANITY_BASE_URL", async () => {
    process.env = { ...baseEnv, SANITY_BASE_URL: "https://sanity.example.com/" };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_BASE_URL).toBe("https://sanity.example.com");
  });

  it("strips trailing slash from CMS_BASE_URL", async () => {
    process.env = { ...baseEnv, CMS_BASE_URL: "https://cms.example.com/" };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.example.com");
  });

  it("parses CMS_DRAFTS_DISABLED_PATHS and CMS_SEARCH_DISABLED_PATHS", async () => {
    process.env = {
      ...baseEnv,
      CMS_DRAFTS_DISABLED_PATHS: "page1, page2 ,",
      CMS_SEARCH_DISABLED_PATHS: "page3, page4 , ",
    };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual(["page1", "page2"]);
    expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["page3", "page4"]);
  });

  it("coerces CMS_PAGINATION_LIMIT to number", async () => {
    process.env = { ...baseEnv, CMS_PAGINATION_LIMIT: "25" };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(25);
  });

  it("defaults optional env vars when missing", async () => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.SANITY_BASE_URL).toBeUndefined();
    expect(cmsEnv.CMS_BASE_URL).toBeUndefined();
    expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([]);
    expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual([]);
  });

  it("throws when SANITY_BASE_URL is invalid", async () => {
    process.env = { ...baseEnv, SANITY_BASE_URL: "not-a-url" };
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

  it("throws when CMS_BASE_URL is invalid", async () => {
    process.env = { ...baseEnv, CMS_BASE_URL: "not-a-url" };
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

  it("throws when CMS_SPACE_URL is invalid", async () => {
    process.env = { ...baseEnv, CMS_SPACE_URL: "not-a-url" };
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when CMS_ACCESS_TOKEN is empty", async () => {
    process.env = { ...baseEnv, CMS_ACCESS_TOKEN: "" };
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_ACCESS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });
});

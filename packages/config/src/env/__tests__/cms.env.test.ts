import { afterEach, describe, expect, it } from "@jest/globals";

const baseEnv = {
  NODE_ENV: "production",
  CMS_SPACE_URL: "https://cms.example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "2024-01-01",
  SANITY_PROJECT_ID: "proj",
  SANITY_DATASET: "dataset",
  SANITY_API_TOKEN: "token",
  SANITY_PREVIEW_SECRET: "secret",
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

  it("defaults SANITY fields in development", async () => {
    process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
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

  it("requires SANITY fields in production", async () => {
    process.env = { ...baseEnv };
    delete process.env.SANITY_API_VERSION;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        SANITY_API_VERSION: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
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

  it("transforms empty string disabled paths to empty arrays", async () => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_DRAFTS_DISABLED_PATHS: "",
      CMS_SEARCH_DISABLED_PATHS: "",
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_DRAFTS_DISABLED_PATHS).toEqual([]);
    expect(result.data.CMS_SEARCH_DISABLED_PATHS).toEqual([]);
  });

  it("splits comma-separated disabled path strings", async () => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_DRAFTS_DISABLED_PATHS: "a,b,c",
      CMS_SEARCH_DISABLED_PATHS: "a,b,c",
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_DRAFTS_DISABLED_PATHS).toEqual(["a", "b", "c"]);
    expect(result.data.CMS_SEARCH_DISABLED_PATHS).toEqual(["a", "b", "c"]);
  });

  it("handles spaces and empty entries in disabled path strings", async () => {
    process.env = {
      ...baseEnv,
      CMS_DRAFTS_DISABLED_PATHS: "a, b , ,c",
      CMS_SEARCH_DISABLED_PATHS: "a, b , ,c",
    };
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual(["a", "b", "c"]);
    expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["a", "b", "c"]);
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

  it.each([
    [1, true],
    [0, false],
  ])("coerces CMS_DRAFTS_ENABLED=%s", async (val, expected) => {
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_DRAFTS_ENABLED: val,
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_DRAFTS_ENABLED).toBe(expected);
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("coerces CMS_DRAFTS_ENABLED string '%s'", async (val, expected) => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_DRAFTS_ENABLED: val,
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_DRAFTS_ENABLED).toBe(expected);
  });

  it.each([
    ["1", true],
    ["0", false],
  ])("coerces CMS_DRAFTS_ENABLED numeric string '%s'", async (val, expected) => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_DRAFTS_ENABLED: val,
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_DRAFTS_ENABLED).toBe(expected);
  });

  it.each([
    [1, true],
    [0, false],
  ])("coerces CMS_SEARCH_ENABLED=%s", async (val, expected) => {
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_SEARCH_ENABLED: val,
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_SEARCH_ENABLED).toBe(expected);
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("coerces CMS_SEARCH_ENABLED string '%s'", async (val, expected) => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_SEARCH_ENABLED: val,
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_SEARCH_ENABLED).toBe(expected);
  });

  it.each([
    ["1", true],
    ["0", false],
  ])("coerces CMS_SEARCH_ENABLED numeric string '%s'", async (val, expected) => {
    process.env = { ...baseEnv };
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const result = cmsEnvSchema.safeParse({
      ...baseEnv,
      CMS_SEARCH_ENABLED: val,
    });
    expect(result.success).toBe(true);
    expect(result.data.CMS_SEARCH_ENABLED).toBe(expected);
  });

  it("defaults booleans to false", async () => {
    process.env = { ...baseEnv } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(false);
    expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(false);
  });
});

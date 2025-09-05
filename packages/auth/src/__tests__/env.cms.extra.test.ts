import { afterEach, describe, expect, it, jest } from "@jest/globals";

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

describe("cms env extras", () => {
  it("trims trailing slashes", async () => {
    process.env = {
      ...baseEnv,
      SANITY_BASE_URL: "https://example.com/",
      CMS_BASE_URL: "https://cms.local/",
    };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.SANITY_BASE_URL).toBe("https://example.com");
    expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.local");
  });

  it("throws on invalid CMS_SPACE_URL", async () => {
    process.env = { ...baseEnv, CMS_SPACE_URL: "not-a-url" };
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("@acme/config/env/cms")).rejects.toThrow(
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

  it("splits disabled path lists", async () => {
    process.env = {
      ...baseEnv,
      CMS_DRAFTS_DISABLED_PATHS: "foo, bar ,baz",
      CMS_SEARCH_DISABLED_PATHS: "",
    };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
    expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual([]);
  });

  it("coerces CMS_PAGINATION_LIMIT to number", async () => {
    process.env = { ...baseEnv, CMS_PAGINATION_LIMIT: "50" };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(50);
  });

  it("throws on invalid CMS_PAGINATION_LIMIT", async () => {
    process.env = { ...baseEnv, CMS_PAGINATION_LIMIT: "abc" };
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("@acme/config/env/cms")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_PAGINATION_LIMIT: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });
});


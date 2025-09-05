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

describe("cms sanity env", () => {
  it("throws when SANITY_PROJECT_ID is missing", async () => {
    process.env = { ...baseEnv };
    delete process.env.SANITY_PROJECT_ID;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("@acme/config/env/cms"))
      .rejects.toThrow("Invalid CMS environment variables");
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("defaults SANITY_DATASET when missing", async () => {
    process.env = { ...baseEnv };
    delete process.env.SANITY_DATASET;
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.SANITY_DATASET).toBe("production");
  });

  it("is read-only when SANITY_API_TOKEN absent", async () => {
    process.env = { ...baseEnv };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.SANITY_API_TOKEN).toBeUndefined();
  });

  it("enables write when SANITY_API_TOKEN provided", async () => {
    process.env = { ...baseEnv, SANITY_API_TOKEN: "tok" };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.SANITY_API_TOKEN).toBe("tok");
  });

  it("enables preview when SANITY_PREVIEW_SECRET set", async () => {
    process.env = { ...baseEnv, SANITY_PREVIEW_SECRET: "secret" };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("secret");
  });

  it("disables preview when SANITY_PREVIEW_SECRET missing", async () => {
    process.env = { ...baseEnv };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.SANITY_PREVIEW_SECRET).toBeUndefined();
  });

  it("parses SANITY_BASE_URL when valid", async () => {
    process.env = { ...baseEnv, SANITY_BASE_URL: "https://sanity.example.com/" };
    const { cmsEnv } = await import("@acme/config/env/cms");
    expect(cmsEnv.SANITY_BASE_URL).toBe("https://sanity.example.com");
  });

  it("throws when SANITY_BASE_URL is invalid", async () => {
    process.env = { ...baseEnv, SANITY_BASE_URL: "not-a-url" };
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("@acme/config/env/cms"))
      .rejects.toThrow("Invalid CMS environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        SANITY_BASE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });
});

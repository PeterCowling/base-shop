/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

describe("cms env – safeParse errors", () => {
  const ORIGINAL_ENV = {
    ...process.env,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "production",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("fails safeParse when CMS_SPACE_URL is missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
      SANITY_API_TOKEN: "token",
      SANITY_PREVIEW_SECRET: "preview-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");

    const parsed = cmsEnvSchema.safeParse({
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
      SANITY_API_TOKEN: "token",
      SANITY_PROJECT_ID: "test-project",
      SANITY_DATASET: "production",
      SANITY_PREVIEW_SECRET: "preview-secret",
    });

    expect(parsed.success).toBe(false);

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      if (!parsed.success) {
        console.error(
          "❌ Invalid CMS environment variables:",
          parsed.error.format(),
        );
        throw new Error("Invalid CMS environment variables");
      }
    }).toThrow("Invalid CMS environment variables");

    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] },
    );
    errorSpy.mockRestore();
  });

  it("fails safeParse when CMS_SPACE_URL is invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
      SANITY_API_TOKEN: "token",
      SANITY_PREVIEW_SECRET: "preview-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");

    const parsed = cmsEnvSchema.safeParse({
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
      SANITY_API_TOKEN: "token",
      SANITY_PROJECT_ID: "test-project",
      SANITY_DATASET: "production",
      SANITY_PREVIEW_SECRET: "preview-secret",
    });

    expect(parsed.success).toBe(false);

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      if (!parsed.success) {
        console.error(
          "❌ Invalid CMS environment variables:",
          parsed.error.format(),
        );
        throw new Error("Invalid CMS environment variables");
      }
    }).toThrow("Invalid CMS environment variables");

    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      { CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) }, _errors: [] },
    );
    errorSpy.mockRestore();
  });
});


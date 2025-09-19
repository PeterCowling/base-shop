/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

describe("cms env – errors (development)", () => {
  const ORIGINAL_ENV = {
    ...process.env,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "production",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("fails when CMS_SPACE_URL is invalid in development", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      })
    );
    errorSpy.mockRestore();
  });

  it("fails when SANITY_API_VERSION is not a string in development", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: 123 as any,
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables"
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        SANITY_API_VERSION: { _errors: expect.arrayContaining([expect.any(String)]) },
      })
    );
    errorSpy.mockRestore();
  });
});


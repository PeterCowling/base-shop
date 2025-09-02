import { afterEach, describe, expect, it } from "@jest/globals";

describe("cms env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("parses valid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv).toMatchObject({
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    });
  });

  it("uses defaults in development when variables are missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;
    delete process.env.CMS_SPACE_URL;
    delete process.env.CMS_ACCESS_TOKEN;
    delete process.env.SANITY_API_VERSION;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv).toMatchObject({
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "placeholder-token",
      SANITY_API_VERSION: "2021-10-21",
    });
  });

  it("throws when required values are missing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;
    delete process.env.CMS_SPACE_URL;
    delete process.env.CMS_ACCESS_TOKEN;
    delete process.env.SANITY_API_VERSION;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: [expect.any(String)] },
        CMS_ACCESS_TOKEN: { _errors: [expect.any(String)] },
        SANITY_API_VERSION: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws on malformed configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "",
      SANITY_API_VERSION: 123 as unknown as string,
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: [expect.any(String)] },
        CMS_ACCESS_TOKEN: { _errors: [expect.any(String)] },
        SANITY_API_VERSION: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });
});


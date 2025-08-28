import { expect } from "@jest/globals";

describe("cmsEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("parses when required variables are present", async () => {
    process.env = {
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
    } as NodeJS.ProcessEnv;

    const { cmsEnv } = await import("../src/env/cms.impl");
    expect(cmsEnv).toEqual({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
    });
  });

  it("throws and logs when CMS_SPACE_URL is invalid", async () => {
    process.env = {
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
    } as NodeJS.ProcessEnv;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../src/env/cms.impl")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when required variables are missing", async () => {
    process.env = {
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://example.com",
    } as NodeJS.ProcessEnv;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../src/env/cms.impl")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });
});

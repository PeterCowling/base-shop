import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;

afterEach(() => {
  jest.resetModules();
  process.env = ORIGINAL_ENV;
});

describe("cms env schema", () => {
  it("defaults CMS_SPACE_URL and CMS_ACCESS_TOKEN outside production", async () => {
    process.env = { NODE_ENV: "test" } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const parsed = cmsEnvSchema.parse({});
    expect(parsed.CMS_SPACE_URL).toBe("https://cms.example.com");
    expect(parsed.CMS_ACCESS_TOKEN).toBe("placeholder-token");
  });

  it("removes trailing slashes from base urls", async () => {
    process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const parsed = cmsEnvSchema.parse({
      SANITY_BASE_URL: "https://sanity.example.com/",
      CMS_BASE_URL: "https://cms.example.com/",
    });
    expect(parsed.SANITY_BASE_URL).toBe("https://sanity.example.com");
    expect(parsed.CMS_BASE_URL).toBe("https://cms.example.com");
  });

  it("parses disabled path lists", async () => {
    process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.ts");
    const parsed = cmsEnvSchema.parse({
      CMS_DRAFTS_DISABLED_PATHS: "/draft1, /draft2 ,",
      CMS_SEARCH_DISABLED_PATHS: "/search1, /search2 ,",
    });
    expect(parsed.CMS_DRAFTS_DISABLED_PATHS).toEqual(["/draft1", "/draft2"]);
    expect(parsed.CMS_SEARCH_DISABLED_PATHS).toEqual(["/search1", "/search2"]);
  });

  it("validates required fields and urls", async () => {
    process.env = {
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "",
    } as unknown as NodeJS.ProcessEnv;
    await expect(import("../cms.ts")).rejects.toThrow(
      "Invalid CMS environment variables",
    );

    process.env = {
      NODE_ENV: "production",
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "token",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnv } = await import("../cms.ts");
    expect(cmsEnv.CMS_SPACE_URL).toBe("https://cms.example.com");
    expect(cmsEnv.CMS_ACCESS_TOKEN).toBe("token");
  });
});

import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;

afterEach(() => {
  jest.resetModules();
  process.env = ORIGINAL_ENV;
});

describe("cmsEnvSchema guards", () => {
  it("parses with defaults in non-production", async () => {
    process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.schema.ts");
    expect(() => cmsEnvSchema.parse({})).not.toThrow();
  });

  it("fails without valid CMS_SPACE_URL in production", async () => {
    process.env = { NODE_ENV: "production" } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { cmsEnvSchema } = await import("../cms.schema.ts");
    expect(() => cmsEnvSchema.parse({ CMS_ACCESS_TOKEN: "token" })).toThrow();
    expect(() =>
      cmsEnvSchema.parse({
        CMS_SPACE_URL: "not-a-url",
        CMS_ACCESS_TOKEN: "token",
      }),
    ).toThrow();
  });

  describe.each([
    ["CMS_DRAFTS_DISABLED_PATHS", "", []],
    ["CMS_DRAFTS_DISABLED_PATHS", "foo, bar", ["foo", "bar"]],
    ["CMS_SEARCH_DISABLED_PATHS", "", []],
    ["CMS_SEARCH_DISABLED_PATHS", "foo, bar", ["foo", "bar"]],
  ])("%s parses list", (field, value, expected) => {
    it("transforms correctly", async () => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      const parsed = cmsEnvSchema.parse({ [field]: value } as any);
      expect(parsed[field as keyof typeof parsed]).toEqual(expected);
    });
  });

  describe("boolish CMS_DRAFTS_ENABLED", () => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
    ])("coerces %s", async (value, expected) => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      const parsed = cmsEnvSchema.parse({ CMS_DRAFTS_ENABLED: value });
      expect(parsed.CMS_DRAFTS_ENABLED).toBe(expected);
    });

    it.each([
      [1, true],
      [0, false],
    ])("coerces numeric %s", async (value, expected) => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      const parsed = cmsEnvSchema.parse({ CMS_DRAFTS_ENABLED: value as any });
      expect(parsed.CMS_DRAFTS_ENABLED).toBe(expected);
    });

    it("errors on invalid strings", async () => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      expect(() =>
        cmsEnvSchema.parse({ CMS_DRAFTS_ENABLED: "taco" }),
      ).toThrow();
    });

    it("errors on invalid numbers", async () => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      expect(() => cmsEnvSchema.parse({ CMS_DRAFTS_ENABLED: 2 as any })).toThrow();
    });
  });

  describe("boolish CMS_SEARCH_ENABLED", () => {
    it.each([
      [1, true],
      [0, false],
    ])("coerces numeric %s", async (value, expected) => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      const parsed = cmsEnvSchema.parse({ CMS_SEARCH_ENABLED: value as any });
      expect(parsed.CMS_SEARCH_ENABLED).toBe(expected);
    });

    it("errors on invalid numbers", async () => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      expect(() => cmsEnvSchema.parse({ CMS_SEARCH_ENABLED: 2 as any })).toThrow();
    });
  });

  describe.each([
    ["SANITY_BASE_URL", "https://sanity.example.com/"],
    ["CMS_BASE_URL", "https://cms.example.com/"],
  ])("%s normalization", (field, url) => {
    it("strips trailing slash", async () => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      const parsed = cmsEnvSchema.parse({ [field]: url } as any);
      expect(parsed[field as keyof typeof parsed]).toBe(url.slice(0, -1));
    });

    it("remains undefined when blank", async () => {
      process.env = { NODE_ENV: "development" } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { cmsEnvSchema } = await import("../cms.schema.ts");
      const parsed = cmsEnvSchema.parse({ [field]: undefined } as any);
      expect(parsed[field as keyof typeof parsed]).toBeUndefined();
    });
  });
});

import { describe, it, expect } from "@jest/globals";
import { cmsEnvSchema } from "@acme/config/env/cms";
import { withEnv } from "./helpers/env";

const base = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("non-production defaults", () => {
  it("provides placeholder space and token", () => {
    const env = cmsEnvSchema.parse({} as any);
    expect(env.CMS_SPACE_URL).toBe("https://cms.example.com");
    expect(env.CMS_ACCESS_TOKEN).toBe("placeholder-token");
  });
});

describe("base URL trimming", () => {
  it("removes trailing slashes", () => {
    const env = cmsEnvSchema.parse({
      ...base,
      SANITY_BASE_URL: "https://sanity.example.com/",
      CMS_BASE_URL: "https://cms.example.com/",
    } as any);
    expect(env.SANITY_BASE_URL).toBe("https://sanity.example.com");
    expect(env.CMS_BASE_URL).toBe("https://cms.example.com");
  });
});

describe("lists, booleans and numbers", () => {
  it("parses lists, booleans and numeric limits", () => {
    const env = cmsEnvSchema.parse({
      ...base,
      CMS_DRAFTS_DISABLED_PATHS: "foo, bar , baz",
      CMS_SEARCH_DISABLED_PATHS: "one, two ",
      CMS_PAGINATION_LIMIT: "50",
      CMS_DRAFTS_ENABLED: "true",
      CMS_SEARCH_ENABLED: 0,
    } as any);
    expect(env.CMS_DRAFTS_DISABLED_PATHS).toEqual([
      "foo",
      "bar",
      "baz",
    ]);
    expect(env.CMS_SEARCH_DISABLED_PATHS).toEqual(["one", "two"]);
    expect(env.CMS_PAGINATION_LIMIT).toBe(50);
    expect(env.CMS_DRAFTS_ENABLED).toBe(true);
    expect(env.CMS_SEARCH_ENABLED).toBe(false);
  });

  it("rejects invalid numbers", () => {
    expect(() =>
      cmsEnvSchema.parse({
        ...base,
        CMS_PAGINATION_LIMIT: "oops",
      } as any),
    ).toThrow();
  });
});

describe("required ids", () => {
  it("throw in production when missing", async () => {
    await expect(
      withEnv({ NODE_ENV: "production" }, () =>
        import("@acme/config/env/cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
  });
});

describe("preview secret", () => {
  it("defaults when absent and uses provided value", () => {
    const env1 = cmsEnvSchema.parse({ ...base } as any);
    expect(env1.SANITY_PREVIEW_SECRET).toBe("dummy-preview-secret");
    const env2 = cmsEnvSchema.parse({
      ...base,
      SANITY_PREVIEW_SECRET: "custom",
    } as any);
    expect(env2.SANITY_PREVIEW_SECRET).toBe("custom");
  });
});

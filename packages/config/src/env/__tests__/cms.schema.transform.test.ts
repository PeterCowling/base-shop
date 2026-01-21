import { describe, expect,it } from "@jest/globals";

import { withEnv } from "../../../test/utils/withEnv";

const loadSchema = () =>
  withEnv({ NODE_ENV: "development" }, () => import("../cms.schema.ts"));

describe("cms schema transforms", () => {
  describe.each(["CMS_DRAFTS_ENABLED", "CMS_SEARCH_ENABLED"] as const)(
    "%s boolish parsing",
    (key) => {
      it.each([
        ["true", true],
        ["false", false],
        ["1", true],
        ["0", false],
        [1, true],
        [0, false],
      ])("accepts %p", async (value, expected) => {
        const { cmsEnvSchema } = await loadSchema();
        const parsed = cmsEnvSchema.parse({ [key]: value } as any);
        expect(parsed[key]).toBe(expected);
      });

      it.each([
        "taco",
        2,
      ])("rejects %p", async (value) => {
        const { cmsEnvSchema } = await loadSchema();
        expect(() =>
          cmsEnvSchema.parse({ [key]: value } as Record<string, unknown>),
        ).toThrow();
      });
    },
  );

  it("strips trailing slashes from base urls", async () => {
    const { cmsEnvSchema } = await loadSchema();
    const parsed = cmsEnvSchema.parse({
      SANITY_BASE_URL: "https://sanity.example.com/",
      CMS_BASE_URL: "https://cms.example.com/",
    });
    expect(parsed.SANITY_BASE_URL).toBe("https://sanity.example.com");
    expect(parsed.CMS_BASE_URL).toBe("https://cms.example.com");
  });

  it("splits and trims disabled path lists", async () => {
    const { cmsEnvSchema } = await loadSchema();
    const parsed = cmsEnvSchema.parse({
      CMS_DRAFTS_DISABLED_PATHS: "/draft1, /draft2 , ,",
      CMS_SEARCH_DISABLED_PATHS: "/search1, /search2 , ,",
    });
    expect(parsed.CMS_DRAFTS_DISABLED_PATHS).toEqual(["/draft1", "/draft2"]);
    expect(parsed.CMS_SEARCH_DISABLED_PATHS).toEqual(["/search1", "/search2"]);
  });

  it("defaults CMS_SPACE_URL and CMS_ACCESS_TOKEN outside production", async () => {
    const { cmsEnvSchema } = await loadSchema();
    const parsed = cmsEnvSchema.parse({});
    expect(parsed.CMS_SPACE_URL).toBe("https://cms.example.com");
    expect(parsed.CMS_ACCESS_TOKEN).toBe("placeholder-token");
  });
});


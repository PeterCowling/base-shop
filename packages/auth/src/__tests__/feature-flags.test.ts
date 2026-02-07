import { describe, expect, it } from "@jest/globals";

import { withEnv } from "./cmsEnvTestUtils";

describe("cms feature flags", () => {
  it("enables write when SANITY_API_TOKEN provided", async () => {
    await withEnv({ SANITY_API_TOKEN: "tok" }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.SANITY_API_TOKEN).toBe("tok");
    });
  });

  it("enables preview when SANITY_PREVIEW_SECRET set", async () => {
    await withEnv({ SANITY_PREVIEW_SECRET: "secret" }, async () => {
      const { cmsEnv } = await import("@acme/config/env/cms");
      expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("secret");
    });
  });

  it("splits disabled path lists", async () => {
    await withEnv(
      {
        CMS_DRAFTS_DISABLED_PATHS: "foo, bar ,baz",
        CMS_SEARCH_DISABLED_PATHS: "",
      },
      async () => {
        const { cmsEnv } = await import("@acme/config/env/cms");
        expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([
          "foo",
          "bar",
          "baz",
        ]);
        expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual([]);
      },
    );
  });
});

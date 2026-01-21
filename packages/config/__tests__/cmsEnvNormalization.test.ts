import { describe, expect,it } from "@jest/globals";

import { withEnv } from "../test/utils/withEnv";

const required = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "2023-01-01",
  SANITY_PROJECT_ID: "test-project",
  SANITY_DATASET: "production",
  SANITY_API_TOKEN: "test-token",
  SANITY_PREVIEW_SECRET: "preview-secret",
};

describe("cmsEnv normalization", () => {
  it("removes trailing slashes from base URLs", async () => {
    const { cmsEnv } = await withEnv(
      {
        NODE_ENV: "production",
        ...required,
        SANITY_BASE_URL: "https://sanity.example.com/",
        CMS_BASE_URL: "https://cms.example.com/",
      },
      () => import("../src/env/cms"),
    );
    expect(cmsEnv.SANITY_BASE_URL).toBe("https://sanity.example.com");
    expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.example.com");
  });

  it("keeps base URLs undefined when not provided", async () => {
    const { cmsEnv } = await withEnv(
      {
        NODE_ENV: "production",
        ...required,
        SANITY_BASE_URL: undefined,
        CMS_BASE_URL: undefined,
      },
      () => import("../src/env/cms"),
    );
    expect(cmsEnv.SANITY_BASE_URL).toBeUndefined();
    expect(cmsEnv.CMS_BASE_URL).toBeUndefined();
  });

  it("splits disabled path lists and filters empty values", async () => {
    const { cmsEnv } = await withEnv(
      {
        NODE_ENV: "production",
        ...required,
        CMS_DRAFTS_DISABLED_PATHS: "a , b,, ",
        CMS_SEARCH_DISABLED_PATHS: "a , b,, ",
      },
      () => import("../src/env/cms"),
    );
    expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual(["a", "b"]);
    expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["a", "b"]);
  });

  it("defaults missing disabled path lists to empty arrays", async () => {
    const { cmsEnv } = await withEnv(
      {
        NODE_ENV: "production",
        ...required,
      },
      () => import("../src/env/cms"),
    );
    expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([]);
    expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual([]);
  });

  it("applies defaults only in development", async () => {
    const dev = await withEnv(
      {
        NODE_ENV: "development",
        CMS_SPACE_URL: undefined,
        CMS_ACCESS_TOKEN: undefined,
        SANITY_API_VERSION: undefined,
        SANITY_PROJECT_ID: undefined,
        SANITY_DATASET: undefined,
      },
      () => import("../src/env/cms"),
    );
    expect(dev.cmsEnv.CMS_SPACE_URL).toBe("https://cms.example.com");
    expect(dev.cmsEnv.CMS_ACCESS_TOKEN).toBe("placeholder-token");

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          CMS_SPACE_URL: undefined,
          CMS_ACCESS_TOKEN: undefined,
          SANITY_API_VERSION: undefined,
        },
        () => import("../src/env/cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
  });
});

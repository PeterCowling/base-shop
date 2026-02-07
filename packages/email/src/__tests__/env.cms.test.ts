import { afterEach,describe, expect, it } from "@jest/globals";

import { withEnv } from "../../../config/test/utils/withEnv";

describe("cms env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires SANITY_PROJECT_ID and SANITY_DATASET", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          CMS_SPACE_URL: "https://example.com",
          CMS_ACCESS_TOKEN: "token",
          SANITY_PROJECT_ID: "",
          SANITY_DATASET: "",
          SANITY_API_TOKEN: "token",
        },
        () => import("@acme/config/env/cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("allows read-only mode without SANITY_API_TOKEN", async () => {
    const { cmsEnv } = await withEnv(
      {
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_PROJECT_ID: "proj",
        SANITY_DATASET: "production",
        SANITY_API_TOKEN: undefined,
      },
      () => import("@acme/config/env/cms"),
    );
    expect(cmsEnv.SANITY_PROJECT_ID).toBe("proj");
  });

  it("loads with API token", async () => {
    const { cmsEnv } = await withEnv(
      {
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_PROJECT_ID: "proj",
        SANITY_DATASET: "production",
        SANITY_API_TOKEN: "token",
      },
      () => import("@acme/config/env/cms"),
    );
    expect(cmsEnv.SANITY_API_TOKEN).toBe("token");
  });

  it("uses default preview secret when unset", async () => {
    const { cmsEnv } = await withEnv(
      {
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_PROJECT_ID: "proj",
        SANITY_DATASET: "production",
        SANITY_API_TOKEN: "token",
        SANITY_PREVIEW_SECRET: undefined,
      },
      () => import("@acme/config/env/cms"),
    );
    expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("dummy-preview-secret");
  });

  it("rejects invalid SANITY_BASE_URL", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          CMS_SPACE_URL: "https://example.com",
          CMS_ACCESS_TOKEN: "token",
          SANITY_PROJECT_ID: "proj",
          SANITY_DATASET: "production",
          SANITY_API_TOKEN: "token",
          SANITY_BASE_URL: "not-a-url",
        },
        () => import("@acme/config/env/cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("accepts valid SANITY_BASE_URL", async () => {
    const { cmsEnv } = await withEnv(
      {
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_PROJECT_ID: "proj",
        SANITY_DATASET: "production",
        SANITY_API_TOKEN: "token",
        SANITY_BASE_URL: "https://cms.example.com/",
      },
      () => import("@acme/config/env/cms"),
    );
    expect(cmsEnv.SANITY_BASE_URL).toBe("https://cms.example.com");
  });
});


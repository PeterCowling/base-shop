import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

describe("cmsEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses when required variables are present", async () => {
    const { cmsEnv } = await withEnv(
      {
        NODE_ENV: "production",
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
      },
      () => import("../src/env/cms"),
    );
    expect(cmsEnv).toMatchObject({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
    });
  });

  it("uses fallback values in development", async () => {
    const { cmsEnv } = await withEnv(
      { NODE_ENV: "development" },
      () => import("../src/env/cms"),
    );

    expect(cmsEnv).toMatchObject({
      CMS_SPACE_URL: "https://cms.example.com",
      CMS_ACCESS_TOKEN: "placeholder-token",
      SANITY_API_VERSION: "2021-10-21",
    });
  });

  it("throws and logs when CMS_SPACE_URL is invalid", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          CMS_SPACE_URL: "not-a-url",
          CMS_ACCESS_TOKEN: "token",
          SANITY_API_VERSION: "2023-01-01",
        },
        () => import("../src/env/cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when required variables are missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          CMS_SPACE_URL: "https://example.com",
        },
        () => import("../src/env/cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
    expect(spy).toHaveBeenCalled();
  });
});


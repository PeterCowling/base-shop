import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("cmsEnv via withEnv", () => {
  it("strips trailing slashes from base URLs", async () => {
    const { cmsEnv } = await withEnv(
      {
        SANITY_BASE_URL: "https://sanity.example.com/",
        CMS_BASE_URL: "https://cms.example.com/",
      },
      () => import("../cms"),
    );
    expect(cmsEnv.SANITY_BASE_URL).toBe("https://sanity.example.com");
    expect(cmsEnv.CMS_BASE_URL).toBe("https://cms.example.com");
  });

  it("parses disabled path lists", async () => {
    const { cmsEnv } = await withEnv(
      {
        CMS_DRAFTS_DISABLED_PATHS: "",
        CMS_SEARCH_DISABLED_PATHS: "a, b",
      },
      () => import("../cms"),
    );
    expect(cmsEnv.CMS_DRAFTS_DISABLED_PATHS).toEqual([]);
    expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["a", "b"]);
  });

  it("logs and throws when CMS_ACCESS_TOKEN missing in production", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          CMS_SPACE_URL: "https://cms.example.com",
          CMS_ACCESS_TOKEN: undefined,
        },
        () => import("../cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_ACCESS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });
});

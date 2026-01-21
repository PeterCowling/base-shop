import { expect } from "@jest/globals";

import { withEnv } from "../test/utils/withEnv";

describe("cmsEnv failure", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws and logs when CMS env is invalid", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          CMS_SPACE_URL: "notaurl",
          CMS_ACCESS_TOKEN: "",
          SANITY_API_VERSION: "",
        },
        () => import("../src/env/cms"),
      ),
    ).rejects.toThrow("Invalid CMS environment variables");
    expect(spy).toHaveBeenCalled();
  });
});


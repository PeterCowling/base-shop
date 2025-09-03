import { expect } from "@jest/globals";

describe("cmsEnv failure", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("throws and logs when CMS env is invalid", async () => {
    process.env = {
      NODE_ENV: "production",
      CMS_SPACE_URL: "notaurl",
      CMS_ACCESS_TOKEN: "",
      SANITY_API_VERSION: "",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/cms")).rejects.toThrow(
      "Invalid CMS environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });
});

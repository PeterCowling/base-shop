/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";
import { createRequire } from "module";

describe("cms env – require behavior", () => {
  const ORIGINAL_ENV = {
    ...process.env,
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "production",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("throws when required with an invalid CMS_SPACE_URL in production", () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2024-01-01",
    } as NodeJS.ProcessEnv;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();

    const req = createRequire(__filename);
    expect(() => req("../cms.ts")).toThrow("Invalid CMS environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid CMS environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });
});


import { describe, expect, it, jest, afterEach } from "@jest/globals";
import { z } from "zod";
import { depositReleaseEnvRefinement, loadCoreEnv } from "./core.js";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("depositReleaseEnvRefinement", () => {
  it("adds issues for invalid DEPOSIT_RELEASE variables", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_INTERVAL_MS"],
      message: "must be a number",
    });
  });
});

describe("loadCoreEnv", () => {
  it("throws on invalid env and succeeds when corrected", () => {
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "nope",
        DEPOSIT_RELEASE_INTERVAL_MS: "later",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    errorSpy.mockRestore();

    const parsed = loadCoreEnv({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
    } as unknown as NodeJS.ProcessEnv);
    expect(parsed.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(parsed.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
  });
});

describe("coreEnv proxy caching", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("caches parsed env across multiple reads", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("./core.js");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    // Access again to ensure caching
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });
});


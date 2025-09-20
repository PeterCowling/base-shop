/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
};

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("coreEnv proxy basic ops", () => {
  it("supports property, in, keys and descriptors", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect("CMS_ACCESS_TOKEN" in mod.coreEnv).toBe(true);
    expect(Object.keys(mod.coreEnv)).toEqual(
      expect.arrayContaining([
        "CMS_SPACE_URL",
        "CMS_ACCESS_TOKEN",
        "SANITY_API_VERSION",
      ]),
    );
    const desc = Object.getOwnPropertyDescriptor(
      mod.coreEnv,
      "CMS_SPACE_URL",
    );
    expect(desc?.value).toBe("https://example.com");
  });
});

describe("core env module (valid env)", () => {
  it("allows proxy operations on valid env", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    expect("CMS_SPACE_URL" in mod.coreEnv).toBe(true);
    expect(Object.keys(mod.coreEnv)).toEqual(
      expect.arrayContaining([
        "CMS_SPACE_URL",
        "CMS_ACCESS_TOKEN",
        "SANITY_API_VERSION",
      ]),
    );
    const desc = Object.getOwnPropertyDescriptor(
      mod.coreEnv,
      "CMS_SPACE_URL",
    );
    expect(desc).toMatchObject({ value: "https://example.com" });
  });
});


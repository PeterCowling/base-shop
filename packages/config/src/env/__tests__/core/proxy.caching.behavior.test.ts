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

describe("coreEnv proxy caching and lazy parsing", () => {
  it("caches parsed env and does not reparse", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      CMS_ACCESS_TOKEN: "token1",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = await import("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token1");
    process.env.CMS_ACCESS_TOKEN = "token2";
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token1");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("parses lazily on first access and caches result", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      CMS_ACCESS_TOKEN: "token1",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    process.env.CMS_ACCESS_TOKEN = "token2";
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token2");
    process.env.CMS_ACCESS_TOKEN = "token3";
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token2");
  });

  it("invokes loadCoreEnv only once when accessing multiple properties", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect(Object.keys(mod.coreEnv)).toEqual(
      expect.arrayContaining([
        "CMS_SPACE_URL",
        "CMS_ACCESS_TOKEN",
        "SANITY_API_VERSION",
      ]),
    );
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("loads env once when using the in operator", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect("CMS_SPACE_URL" in mod.coreEnv).toBe(true);
    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect("CMS_ACCESS_TOKEN" in mod.coreEnv).toBe(true);
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("loads env once when listing keys", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(Object.keys(mod.coreEnv)).toEqual(
      expect.arrayContaining([
        "CMS_SPACE_URL",
        "CMS_ACCESS_TOKEN",
        "SANITY_API_VERSION",
      ]),
    );
    expect(parseSpy).toHaveBeenCalledTimes(1);
    Object.keys(mod.coreEnv);
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("loads env once when getting property descriptor", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(
      Object.getOwnPropertyDescriptor(mod.coreEnv, "CMS_SPACE_URL")?.value,
    ).toBe("https://example.com");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    Object.getOwnPropertyDescriptor(mod.coreEnv, "CMS_ACCESS_TOKEN");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("caches parse across different proxy operations", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect("CMS_SPACE_URL" in mod.coreEnv).toBe(true);
    Object.keys(mod.coreEnv);
    Object.getOwnPropertyDescriptor(mod.coreEnv, "CMS_SPACE_URL");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });
});

describe("coreEnv proxy caching (redundant validations)", () => {
  it("invokes loadCoreEnv only once for multiple property reads", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("caches AUTH_TOKEN_TTL across property reads", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      AUTH_TOKEN_TTL: "60s",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(mod.coreEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });
});


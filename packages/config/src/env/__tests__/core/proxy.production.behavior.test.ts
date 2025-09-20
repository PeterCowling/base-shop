/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { NEXT_SECRET, SESSION_SECRET } from "../authEnvTestUtils.ts";

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

describe("coreEnv in production", () => {
  it("parses env once during module load in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    delete process.env.JEST_WORKER_ID;
    jest.resetModules();
    const mod = await import("../../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(parseSpy).not.toHaveBeenCalled();
    parseSpy.mockRestore();
  });

  it("triggers proxy traps without reparsing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    delete process.env.JEST_WORKER_ID;
    jest.resetModules();
    const mod = await import("../../core.ts");
    const loadSpy = jest.spyOn(mod, "loadCoreEnv");
    loadSpy.mockClear();

    expect("CMS_SPACE_URL" in mod.coreEnv).toBe(true);
    expect(Object.keys(mod.coreEnv)).toEqual(
      expect.arrayContaining([
        "CMS_SPACE_URL",
        "CMS_ACCESS_TOKEN",
        "SANITY_API_VERSION",
        "CART_COOKIE_SECRET",
      ]),
    );
    expect(
      Object.getOwnPropertyDescriptor(mod.coreEnv, "CMS_SPACE_URL")?.value,
    ).toBe("https://example.com");

    expect(loadSpy).not.toHaveBeenCalled();
  });

  it("parses immediately in production via NODE_ENV access", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      CMS_ACCESS_TOKEN: "token1",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = await import("../../core.ts");
    process.env.CMS_ACCESS_TOKEN = "token2";
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token1");
  });

  it("imports without error in production when env is valid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET: SESSION_SECRET,
    } as NodeJS.ProcessEnv;
    delete process.env.JEST_WORKER_ID;
    jest.resetModules();
    const mod = await import("../../core.ts");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
  });

  it("fails fast on import in production when required vars are missing", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;
    delete process.env.CART_COOKIE_SECRET;
    delete process.env.JEST_WORKER_ID;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../../core.ts")).rejects.toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • CART_COOKIE_SECRET: Required",
    );
    errorSpy.mockRestore();
  });

  it("fails fast in production when deposit vars are invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      DEPOSIT_RELEASE_ENABLED: "nope",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    delete process.env.JEST_WORKER_ID;
    await expect(import("../../core.ts")).rejects.toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    errorSpy.mockRestore();
  });
});


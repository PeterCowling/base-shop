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

describe("coreEnv error handling and logging", () => {
  it("logs detailed messages and throws on invalid configuration", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      DEPOSIT_RELEASE_ENABLED: "yes",
      LATE_FEE_INTERVAL_MS: "fast",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    expect(() => {
      const mod = require("../../core.ts");
      void mod.coreEnv.CART_COOKIE_SECRET;
    }).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • LATE_FEE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });

  it("throws when required CART_COOKIE_SECRET is missing in production", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;
    delete process.env.CART_COOKIE_SECRET;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    expect(() => {
      require("../../core.ts");
    }).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • CART_COOKIE_SECRET: Required",
    );
    errorSpy.mockRestore();
  });

  it("throws on import in production for invalid deposit variables", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      DEPOSIT_RELEASE_ENABLED: "maybe",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    expect(() => require("../../core.ts")).toThrow(
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

  it("throws and logs when using in operator with invalid env", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "nope",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const mod = require("../../core.ts");
    expect(() => {
      void ("CMS_SPACE_URL" in mod.coreEnv);
    }).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    errorSpy.mockRestore();
  });

  it("throws and logs when listing keys with invalid env", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "nope",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const mod = require("../../core.ts");
    expect(() => {
      Object.keys(mod.coreEnv);
    }).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    errorSpy.mockRestore();
  });

  it("throws and logs when getting property descriptor with invalid env", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "nope",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    const mod = require("../../core.ts");
    expect(() => {
      Object.getOwnPropertyDescriptor(mod.coreEnv, "CMS_SPACE_URL");
    }).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    errorSpy.mockRestore();
  });
});

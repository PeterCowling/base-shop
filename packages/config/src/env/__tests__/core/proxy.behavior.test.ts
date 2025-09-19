/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { loadCoreEnv } from "../../core.ts";
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

describe("loadCoreEnv NODE_ENV handling", () => {
  const base = { ...baseEnv };

  it("handles production", () => {
    const env = loadCoreEnv({
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv);
    expect(env.NODE_ENV).toBe("production");
    expect(env.CART_COOKIE_SECRET).toBe("secret");
  });

  it.each(["development", "test"])(
    "defaults secret in %s",
    (nodeEnv) => {
      const env = loadCoreEnv({
        ...base,
        NODE_ENV: nodeEnv,
      } as NodeJS.ProcessEnv);
      expect(env.NODE_ENV).toBe(nodeEnv);
      expect(env.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    },
  );
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

describe("core env module", () => {
  it("uses default CART_COOKIE_SECRET in development when omitted", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "development",
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET: SESSION_SECRET,
    } as NodeJS.ProcessEnv;
    delete process.env.CART_COOKIE_SECRET;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    const { coreEnv } = require("../../core.ts");
    expect(coreEnv.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

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
      mod.coreEnv.CART_COOKIE_SECRET;
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
      "CMS_SPACE_URL" in mod.coreEnv;
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
});

describe("coreEnv proxy caching", () => {
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

describe("coreEnv proxy NODE_ENV behavior", () => {
  const base = {
    ...baseEnv,
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    CART_COOKIE_SECRET: "secret",
    EMAIL_PROVIDER: "smtp",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  it.each(["development", "test"]) (
    "lazy loads in %s",
    async (env) => {
      process.env = { ...base, NODE_ENV: env } as NodeJS.ProcessEnv;
      jest.resetModules();
      const mod = await import("../../core.ts");
      const loadSpy = jest.spyOn(mod, "loadCoreEnv");
      expect(loadSpy).not.toHaveBeenCalled();
      expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
      expect(loadSpy).not.toHaveBeenCalled();
    },
  );

  it("eager loads in production", async () => {
    process.env = {
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = await import("../../core.ts");
    const loadSpy = jest.spyOn(mod, "loadCoreEnv");
    loadSpy.mockClear();
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(loadSpy).not.toHaveBeenCalled();
  });
});

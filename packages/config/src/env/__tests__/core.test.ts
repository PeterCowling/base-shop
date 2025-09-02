import { afterEach, describe, expect, it } from "@jest/globals";
import { z } from "zod";
import {
  coreEnvBaseSchema,
  coreEnvSchema,
  depositReleaseEnvRefinement,
  loadCoreEnv,
} from "../core.js";

const schema = coreEnvBaseSchema.superRefine(depositReleaseEnvRefinement);

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("core env refinement", () => {
  it("accepts valid custom prefixed variables", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_CUSTOM_ENABLED: "true",
      DEPOSIT_RELEASE_CUSTOM_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_EXTRA_ENABLED: "false",
      REVERSE_LOGISTICS_EXTRA_INTERVAL_MS: "2000",
      LATE_FEE_SPECIAL_ENABLED: "true",
      LATE_FEE_SPECIAL_INTERVAL_MS: "3000",
    });
    expect(parsed.success).toBe(true);
  });

  it("reports invalid custom prefixed variables", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_BAD_ENABLED: "maybe",
      REVERSE_LOGISTICS_BAD_INTERVAL_MS: "soon",
      LATE_FEE_BAD_ENABLED: "nope",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_BAD_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_BAD_INTERVAL_MS"],
            message: "must be a number",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_BAD_ENABLED"],
            message: "must be true or false",
          }),
        ]),
      );
    }
  });

  it("reports custom issue for invalid ENABLED variable", () => {
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_FOO_ENABLED: "notbool",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
            message: "must be true or false",
          }),
        ]),
      );
    }
  });

  it("reports custom issue for invalid INTERVAL_MS variable", () => {
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      REVERSE_LOGISTICS_BAR_INTERVAL_MS: "soon",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["REVERSE_LOGISTICS_BAR_INTERVAL_MS"],
            message: "must be a number",
          }),
        ]),
      );
    }
  });

  it("reports invalid DEPOSIT_RELEASE_ENABLED", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "yes",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["DEPOSIT_RELEASE_ENABLED"],
        message: "must be true or false",
      });
    }
  });

  it("reports non-numeric LATE_FEE_INTERVAL_MS", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      LATE_FEE_INTERVAL_MS: "fast",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["LATE_FEE_INTERVAL_MS"],
        message: "must be a number",
      });
    }
  });

  it("rejects non-boolean *_ENABLED and non-numeric *_INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_FOO_ENABLED: "yes",
        REVERSE_LOGISTICS_BAR_INTERVAL_MS: "later",
        LATE_FEE_BAZ_ENABLED: "maybe",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_BAR_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_BAZ_ENABLED"],
      message: "must be true or false",
    });
  });
});

describe("core env defaults", () => {
  it("defaults CART_COOKIE_SECRET when not in production", () => {
    const parsed = schema.safeParse({ ...baseEnv });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    }
  });
});

describe("core env optional variables", () => {
  it("parses numeric CART_TTL when valid", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      CART_TTL: "123",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CART_TTL).toBe(123);
    }
  });

  it("allows missing optional CART_TTL", () => {
    const parsed = schema.safeParse({ ...baseEnv });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CART_TTL).toBeUndefined();
    }
  });

  it("reports non-numeric CART_TTL", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      CART_TTL: "not-a-number",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["CART_TTL"],
        message: expect.stringContaining("Expected number"),
      });
    }
  });
});

describe("loadCoreEnv", () => {
  it("throws and logs issues for malformed env", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "fast",
      } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });
});

describe("core env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("uses default CART_COOKIE_SECRET in development when omitted", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;
    delete process.env.CART_COOKIE_SECRET;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    const { coreEnv } = require("../core.js");
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
    const { coreEnv } = await import("../core.js");
    expect(coreEnv.CMS_ACCESS_TOKEN).toBe("token1");
    // Mutate process.env to what would be parsed if re-run
    process.env.CMS_ACCESS_TOKEN = "token2";
    expect(coreEnv.CMS_ACCESS_TOKEN).toBe("token1");
  });

  it("invokes loadCoreEnv only once when accessing multiple properties", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../core.js");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    expect(mod.coreEnv.SANITY_API_VERSION).toBe("v1");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("triggers proxy traps without reparsing in production", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = await import("../core.ts");
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
      const mod = require("../core.js");
      // Access a property to trigger validation.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
      require("../core.js");
    }).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • CART_COOKIE_SECRET: Required",
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
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../core.js")).rejects.toThrow(
      "Invalid core environment variables",
    );
    errorSpy.mockRestore();
  });
});

describe("loadCoreEnv", () => {
  const ORIGINAL_ENV = process.env;
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns parsed env on success without logging", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const env = loadCoreEnv({
      ...baseEnv,
      NODE_ENV: "development",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      CART_COOKIE_SECRET: "dev-cart-secret",
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws and logs issues for invalid env values", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "fast",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });

  it("throws when required variables are invalid", () => {
    process.env = {
      CMS_SPACE_URL: "not-a-url",
      CMS_ACCESS_TOKEN: "",
      SANITY_API_VERSION: "v1",
    } as unknown as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadCoreEnv(process.env)).toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_SPACE_URL"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_ACCESS_TOKEN"),
    );
    errorSpy.mockRestore();
  });
});


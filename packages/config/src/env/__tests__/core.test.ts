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
        SOME_FEATURE_ENABLED: "nope",
        OTHER_FEATURE_INTERVAL_MS: "soon",
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

  it("emits issue for invalid custom *_ENABLED variable", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_TEST_ENABLED: "notbool",
        OTHER_FEATURE_INTERVAL_MS: "later",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_TEST_ENABLED"],
      message: "must be true or false",
    });
  });

  it("emits issue for invalid custom *_INTERVAL_MS variable", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_TEST_INTERVAL_MS: "soon",
        SOME_FEATURE_ENABLED: "nope",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["DEPOSIT_RELEASE_TEST_INTERVAL_MS"],
      message: "must be a number",
    });
  });

  it("skips base keys and accepts valid custom deposit values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "true",
        DEPOSIT_RELEASE_INTERVAL_MS: "1000",
        REVERSE_LOGISTICS_ENABLED: "false",
        REVERSE_LOGISTICS_INTERVAL_MS: "2000",
        LATE_FEE_ENABLED: "true",
        LATE_FEE_INTERVAL_MS: "3000",
        DEPOSIT_RELEASE_FOO_ENABLED: "true",
        REVERSE_LOGISTICS_BAR_INTERVAL_MS: "4000",
        LATE_FEE_BAZ_ENABLED: "false",
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
  });

  it("ignores unrelated *_ENABLED and *_INTERVAL_MS variables", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        SOME_FEATURE_ENABLED: "nope",
        OTHER_FEATURE_INTERVAL_MS: "later",
      },
      ctx,
    );
    expect(ctx.addIssue).not.toHaveBeenCalled();
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

  it("parses optional GA_API_SECRET when string", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      GA_API_SECRET: "secret",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.GA_API_SECRET).toBe("secret");
    }
  });

  it("reports non-string GA_API_SECRET", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      GA_API_SECRET: 123 as unknown as string,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["GA_API_SECRET"],
        message: expect.stringContaining("Expected string"),
      });
    }
  });

  it("parses optional DATABASE_URL when string", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      DATABASE_URL: "postgres://example",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.DATABASE_URL).toBe("postgres://example");
    }
  });

  it("reports non-string DATABASE_URL", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      DATABASE_URL: 456 as unknown as string,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["DATABASE_URL"],
        message: expect.stringContaining("Expected string"),
      });
    }
  });

  it("parses optional CLOUDFLARE_ACCOUNT_ID when string", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      CLOUDFLARE_ACCOUNT_ID: "cf-account",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CLOUDFLARE_ACCOUNT_ID).toBe("cf-account");
    }
  });

  it("reports non-string CLOUDFLARE_ACCOUNT_ID", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      CLOUDFLARE_ACCOUNT_ID: 789 as unknown as string,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]).toMatchObject({
        path: ["CLOUDFLARE_ACCOUNT_ID"],
        message: expect.stringContaining("Expected string"),
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

  it("parses lazily on first access and caches result", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      CMS_ACCESS_TOKEN: "token1",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../core.js");
    // Update after import but before access to ensure lazy parsing.
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
    const mod = require("../core.js");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    expect(mod.coreEnv.SANITY_API_VERSION).toBe("v1");
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });

  it("loads env once when using the in operator", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../core.js");
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
    const mod = require("../core.js");
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
    const mod = require("../core.js");
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
    const mod = require("../core.js");
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
    jest.resetModules();
    const mod = await import("../core.ts");
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

  it("parses immediately in production via NODE_ENV access", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      CMS_ACCESS_TOKEN: "token1",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = await import("../core.js");
    // Mutate after import; value should remain cached from import-time parse.
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
    expect(() => require("../core.js")).toThrow(
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
    const mod = require("../core.js");
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
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
    const mod = require("../core.js");
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
    const mod = require("../core.js");
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
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../core.js")).rejects.toThrow(
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
    await expect(import("../core.js")).rejects.toThrow(
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

  it("coerces optional export, phase, luxury and stock alert vars", () => {
    const env = loadCoreEnv({
      ...baseEnv,
      OUTPUT_EXPORT: "true",
      NEXT_PUBLIC_PHASE: "beta",
      LUXURY_FEATURES_RA_TICKETING: "",
      LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: "5",
      LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: "true",
      LUXURY_FEATURES_TRACKING_DASHBOARD: "",
      LUXURY_FEATURES_RETURNS: "true",
      STOCK_ALERT_RECIPIENTS: "a@a.com,b@b.com",
      STOCK_ALERT_WEBHOOK: "https://example.com/hook",
      STOCK_ALERT_DEFAULT_THRESHOLD: "10",
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      OUTPUT_EXPORT: true,
      NEXT_PUBLIC_PHASE: "beta",
      LUXURY_FEATURES_RA_TICKETING: false,
      LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: 5,
      LUXURY_FEATURES_REQUIRE_STRONG_CUSTOMER_AUTH: true,
      LUXURY_FEATURES_TRACKING_DASHBOARD: false,
      LUXURY_FEATURES_RETURNS: true,
      STOCK_ALERT_RECIPIENTS: "a@a.com,b@b.com",
      STOCK_ALERT_WEBHOOK: "https://example.com/hook",
      STOCK_ALERT_DEFAULT_THRESHOLD: 10,
      STOCK_ALERT_RECIPIENT: "alert@example.com",
    });
  });

  it("logs issues and throws for invalid optional vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        NEXT_PUBLIC_PHASE: 123 as unknown as string,
        LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD: "abc",
        STOCK_ALERT_RECIPIENTS: 456 as unknown as string,
        STOCK_ALERT_WEBHOOK: "not-a-url",
        STOCK_ALERT_DEFAULT_THRESHOLD: "oops",
        STOCK_ALERT_RECIPIENT: "not-an-email",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXT_PUBLIC_PHASE"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("LUXURY_FEATURES_FRAUD_REVIEW_THRESHOLD"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_RECIPIENTS"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_WEBHOOK"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_DEFAULT_THRESHOLD"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("STOCK_ALERT_RECIPIENT"),
    );
    errorSpy.mockRestore();
  });

  it("parses valid deposit, reverse logistics and late fee vars", () => {
    const env = loadCoreEnv({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    } as unknown as NodeJS.ProcessEnv);
    expect(env).toMatchObject({
      DEPOSIT_RELEASE_ENABLED: true,
      DEPOSIT_RELEASE_INTERVAL_MS: 1000,
      REVERSE_LOGISTICS_ENABLED: false,
      REVERSE_LOGISTICS_INTERVAL_MS: 2000,
      LATE_FEE_ENABLED: true,
      LATE_FEE_INTERVAL_MS: 3000,
    });
  });

  it("logs issues and throws for invalid deposit/reverse/late fee vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_ENABLED: "maybe",
        LATE_FEE_INTERVAL_MS: "soon",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • REVERSE_LOGISTICS_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • LATE_FEE_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });

  it("logs all issues for mixed invalid variables", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        CMS_SPACE_URL: "not-a-url",
        DEPOSIT_RELEASE_ENABLED: "nope",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("CMS_SPACE_URL"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
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


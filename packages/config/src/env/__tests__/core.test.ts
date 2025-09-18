/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";
import { z } from "zod";
import {
  coreEnvBaseSchema,
  coreEnvSchema,
  depositReleaseEnvRefinement,
  loadCoreEnv,
} from "../core.ts";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";

const schema = coreEnvBaseSchema.superRefine(depositReleaseEnvRefinement);

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
});

describe("requireEnv", () => {
  const getRequire = async () => (await import("../core.ts")).requireEnv as any;

  it("returns value for existing variables", async () => {
    process.env.REQ = "present";
    const requireEnv = await getRequire();
    expect(requireEnv("REQ")).toBe("present");
  });

  it("throws when variable is missing", async () => {
    const requireEnv = await getRequire();
    expect(() => requireEnv("MISSING")).toThrow();
  });

  it("throws on empty value", async () => {
    process.env.EMPTY = "";
    const requireEnv = await getRequire();
    expect(() => requireEnv("EMPTY")).toThrow();
  });

  it("throws on whitespace-only value", async () => {
    process.env.SPACE = "   ";
    const requireEnv = await getRequire();
    expect(() => requireEnv("SPACE")).toThrow();
  });

  it("trims surrounding whitespace", async () => {
    process.env.TRIM = "  value  ";
    const requireEnv = await getRequire();
    expect(requireEnv("TRIM")).toBe("value");
  });
});

describe("requireEnv boolean parsing", () => {
  const getRequire = async () => (await import("../core.ts")).requireEnv as any;
  const cases: Array<[string, boolean]> = [
    ["true", true],
    [" false ", false],
    ["1", true],
    ["0", false],
    ["TRUE", true],
    ["FaLsE", false],
  ];

  it.each(cases)("parses boolean %s", async (input, expected) => {
    process.env.BOOL = input;
    const requireEnv = await getRequire();
    expect(requireEnv("BOOL", "boolean")).toBe(expected);
  });

  it.each(["yes", "no"])("rejects boolean %s", async (input) => {
    process.env.BOOL = input;
    const requireEnv = await getRequire();
    expect(() => requireEnv("BOOL", "boolean")).toThrow();
  });
});

describe("requireEnv number parsing", () => {
  const getRequire = async () => (await import("../core.ts")).requireEnv as any;

  const valid: Array<[string, number]> = [
    ["1", 1],
    ["-2", -2],
    ["3.14", 3.14],
    [" 4 ", 4],
  ];

  it.each(valid)("parses number %s", async (input, expected) => {
    process.env.NUM = input;
    const requireEnv = await getRequire();
    expect(requireEnv("NUM", "number")).toBe(expected);
  });

  it.each(["NaN", "not-a-number"])(
    "rejects invalid number %s",
    async (input) => {
      process.env.NUM = input;
      const requireEnv = await getRequire();
      expect(() => requireEnv("NUM", "number")).toThrow();
    },
  );
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
    const mod = require("../core.ts");
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

  it("records issues for invalid base deposit, reverse logistics and late fee vars", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
        REVERSE_LOGISTICS_ENABLED: "maybe",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
        LATE_FEE_ENABLED: "nah",
        LATE_FEE_INTERVAL_MS: "whenever",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledTimes(6);
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
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["REVERSE_LOGISTICS_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_ENABLED"],
      message: "must be true or false",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_INTERVAL_MS"],
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

  it("ignores DEPOSIT_RELEASE keys without ENABLED or INTERVAL_MS", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      { DEPOSIT_RELEASE_SOMETHING_ELSE: "foo" },
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
  it.each([
    ["1", true],
    ["", false],
  ])("coerces OUTPUT_EXPORT=%s to %s", (val, expected) => {
    const parsed = schema.safeParse({
      ...baseEnv,
      OUTPUT_EXPORT: val,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.OUTPUT_EXPORT).toBe(expected);
    }
  });

  it.each(["development", "test", "production"]) (
    "accepts NODE_ENV=%s",
    (value) => {
      const parsed = schema.safeParse({
        ...baseEnv,
        NODE_ENV: value,
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.NODE_ENV).toBe(value);
      }
    },
  );

  it("rejects invalid NODE_ENV", () => {
    const parsed = schema.safeParse({
      ...baseEnv,
      NODE_ENV: "staging",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["NODE_ENV"] }),
        ]),
      );
    }
  });

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

describe("core env sub-schema integration", () => {
  it("reports missing redis token when SESSION_STORE=redis", () => {
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["UPSTASH_REDIS_REST_TOKEN"],
            message:
              "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
          }),
        ]),
      );
    }
  });

  it("requires SENDGRID_API_KEY when EMAIL_PROVIDER=sendgrid", () => {
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      EMAIL_PROVIDER: "sendgrid",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["SENDGRID_API_KEY"],
            message: "Required",
          }),
        ]),
      );
    }
  });

  it("propagates issues from auth and email schemas", () => {
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
      EMAIL_PROVIDER: "sendgrid",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["UPSTASH_REDIS_REST_TOKEN"],
            message:
              "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
          }),
          expect.objectContaining({
            path: ["SENDGRID_API_KEY"],
            message: "Required",
          }),
        ]),
      );
    }
  });
});

describe("coreEnvSchema deposit release refinement", () => {
  it("flags invalid values and accepts valid ones", () => {
    const invalid = coreEnvSchema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "maybe",
      LATE_FEE_INTERVAL_MS: "abc",
      REVERSE_LOGISTICS_ENABLED: "true",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "false",
    });
    expect(invalid.success).toBe(false);
    if (!invalid.success) {
      expect(invalid.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["DEPOSIT_RELEASE_ENABLED"],
            message: "must be true or false",
          }),
          expect.objectContaining({
            path: ["LATE_FEE_INTERVAL_MS"],
            message: "must be a number",
          }),
        ]),
      );
    }

    const valid = coreEnvSchema.safeParse({
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    });
    expect(valid.success).toBe(true);
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

  it("logs each issue and throws for missing required secrets", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    process.env.NODE_ENV = "production";
    const { loadCoreEnv } = await import("../core.ts");
    expect(() => loadCoreEnv({} as NodeJS.ProcessEnv)).toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("NEXTAUTH_SECRET"),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SESSION_SECRET"),
    );
    errorSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
    jest.resetModules();
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
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET: SESSION_SECRET,
    } as NodeJS.ProcessEnv;
    delete process.env.CART_COOKIE_SECRET;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    const { coreEnv } = require("../core.ts");
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
    const mod = await import("../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token1");
    // Mutate process.env to what would be parsed if re-run
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    delete process.env.JEST_WORKER_ID;
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
    const mod = await import("../core.ts");
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
      const mod = require("../core.ts");
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
      require("../core.ts");
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
    expect(() => require("../core.ts")).toThrow(
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    const mod = require("../core.ts");
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
    await expect(import("../core.ts")).rejects.toThrow(
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
    await expect(import("../core.ts")).rejects.toThrow(
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
    const mod = await import("../core.ts");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
  });
});

describe("loadCoreEnv", () => {
  const ORIGINAL_ENV = process.env;
  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("logs and throws when required env vars are invalid", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        CMS_SPACE_URL: "not-a-url",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    errorSpy.mockRestore();
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

describe("depositReleaseEnvRefinement", () => {
  it("adds issues for malformed built-in variables", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
        LATE_FEE_ENABLED: "maybe",
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
      path: ["REVERSE_LOGISTICS_INTERVAL_MS"],
      message: "must be a number",
    });
    expect(ctx.addIssue).toHaveBeenCalledWith({
      code: z.ZodIssueCode.custom,
      path: ["LATE_FEE_ENABLED"],
      message: "must be true or false",
    });
  });

  it("adds issues for malformed custom variables", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_FOO_ENABLED: "yes",
        LATE_FEE_BAR_INTERVAL_MS: "soon",
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
      path: ["LATE_FEE_BAR_INTERVAL_MS"],
      message: "must be a number",
    });
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  it.each([
    [30, undefined],
    ["30", "30s"],
    [" 45s ", "45s"],
    ["5 m", "5m"],
  ])("normalizes %p to %p", async (input, normalized) => {
    const { coreEnvSchema } = await import("../core.ts");
    const { authEnvSchema } = await import("../auth.js");
    const refine = (coreEnvSchema as any)._def.effect.refinement as (
      env: Record<string, unknown>,
      ctx: z.RefinementCtx,
    ) => void;
    const spy = jest
      .spyOn(authEnvSchema, "safeParse")
      .mockReturnValue({ success: true, data: {} } as any);
    refine({ ...baseEnv, AUTH_TOKEN_TTL: input as any }, { addIssue: () => {} });
    const arg = spy.mock.calls[0][0] as Record<string, unknown>;
    if (normalized === undefined) {
      expect(arg).not.toHaveProperty("AUTH_TOKEN_TTL");
    } else {
      expect(arg).toHaveProperty("AUTH_TOKEN_TTL", normalized);
    }
    spy.mockRestore();
  });
});

describe("loadCoreEnv logging", () => {
  it("logs errors for malformed deposit env vars", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        ...baseEnv,
        DEPOSIT_RELEASE_ENABLED: "yes",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "  • REVERSE_LOGISTICS_INTERVAL_MS: must be a number",
    );
    errorSpy.mockRestore();
  });
});

describe("coreEnv proxy caching", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("invokes loadCoreEnv only once for multiple property reads", () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = require("../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    // access again to ensure cached
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
    const mod = require("../core.ts");
    const parseSpy = jest.spyOn(mod.coreEnvSchema, "safeParse");
    expect(mod.coreEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(mod.coreEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(parseSpy).toHaveBeenCalledTimes(1);
    parseSpy.mockRestore();
  });
});

describe("typed variable helpers", () => {
  it("retrieves string, number, and boolean variables", () => {
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
      OUTPUT_EXPORT: "true",
      CART_TTL: "99",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.OUTPUT_EXPORT).toBe(true);
      expect(parsed.data.CART_TTL).toBe(99);
      expect(parsed.data.CMS_SPACE_URL).toBe("https://example.com");
    }
  });

  it("falls back to defaults when variables are missing", () => {
    const parsed = coreEnvSchema.safeParse({
      ...baseEnv,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    }
  });

  it("reports errors for absent or malformed variables", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        CMS_SPACE_URL: "",
        CMS_ACCESS_TOKEN: "",
        SANITY_API_VERSION: "v1",
        OUTPUT_EXPORT: "notbool",
        CART_TTL: "abc",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    errorSpy.mockRestore();
  });

  it("coerces booleans and validates numbers", () => {
    const boolParsed = coreEnvSchema.safeParse({
      ...baseEnv,
      OUTPUT_EXPORT: "",
    });
    expect(boolParsed.success).toBe(true);
    if (boolParsed.success) {
      expect(boolParsed.data.OUTPUT_EXPORT).toBe(false);
    }

    const numParsed = coreEnvSchema.safeParse({
      ...baseEnv,
      CART_TTL: "",
    });
    expect(numParsed.success).toBe(true);
    if (numParsed.success) {
      expect(numParsed.data.CART_TTL).toBe(0);
    }
  });
});

describe("loadCoreEnv required variable validation", () => {
  const ORIGINAL_ENV = process.env;
  const base = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    NODE_ENV: "production",
    CART_COOKIE_SECRET: "secret",
    NEXTAUTH_SECRET: NEXT_SECRET, 
    SESSION_SECRET: SESSION_SECRET,
    EMAIL_FROM: "test@example.com",
    EMAIL_PROVIDER: "smtp",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  describe("CMS_SPACE_URL", () => {
    it.each([
      ["present", "https://example.com", true],
      ["missing", undefined, false],
      ["empty", "", false],
      ["whitespace", "   ", false],
      ["invalid", "not-a-url", false],
    ])("%s", async (_label, value, ok) => {
      jest.resetModules();
      Object.assign(process.env, base);
      const { loadCoreEnv } = await import("../core.ts");
      const env = { ...base } as NodeJS.ProcessEnv;
      if (value === undefined) delete env.CMS_SPACE_URL;
      else env.CMS_SPACE_URL = value;
      const run = () => loadCoreEnv(env);
      ok
        ? expect(run).not.toThrow()
        : expect(run).toThrow("Invalid core environment variables");
    });
  });

  describe("CART_COOKIE_SECRET", () => {
    it.each([
      ["present", "secret", true],
      ["missing", undefined, false],
      ["empty", "", false],
      ["whitespace", "   ", true],
    ])("%s", async (_label, value, ok) => {
      jest.resetModules();
      Object.assign(process.env, base);
      const { loadCoreEnv } = await import("../core.ts");
      const env = {
        ...base,
        CMS_SPACE_URL: "https://example.com",
      } as NodeJS.ProcessEnv;
      if (value === undefined) delete env.CART_COOKIE_SECRET;
      else env.CART_COOKIE_SECRET = value;
      const run = () => loadCoreEnv(env);
      ok
        ? expect(run).not.toThrow()
        : expect(run).toThrow("Invalid core environment variables");
    });
  });
});

describe("loadCoreEnv boolean parsing", () => {
  const ORIGINAL_ENV = process.env;
  const base = {
    ...baseEnv,
    CART_COOKIE_SECRET: "secret",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  describe("OUTPUT_EXPORT", () => {
    it.each([
      ["true", true],
      ["false", true],
      ["1", true],
      ["0", true],
      ["yes", true],
      ["no", true],
      [" TRUE ", true],
      [" False ", true],
      [" 1 ", true],
      ["0 ", true],
      [" Yes ", true],
      [" no ", true],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, OUTPUT_EXPORT: input };
      const { loadCoreEnv } = await import("../core.ts");
      const env = loadCoreEnv();
      expect(env.OUTPUT_EXPORT).toBe(expected);
    });
  });

  describe("DEPOSIT_RELEASE_ENABLED", () => {
    it.each([
      ["true", true],
      ["false", false],
    ])("accepts %s", async (input, expected) => {
      process.env = { ...base, DEPOSIT_RELEASE_ENABLED: input };
      const { loadCoreEnv } = await import("../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_ENABLED).toBe(expected);
    });

    it.each(["1", "0", "yes", "no", " TRUE ", " false "]) (
      "rejects %s",
      async (input) => {
        process.env = { ...base, DEPOSIT_RELEASE_ENABLED: input };
        const { loadCoreEnv } = await import("../core.ts");
        expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
      },
    );
  });
});

describe("loadCoreEnv number parsing", () => {
  const ORIGINAL_ENV = process.env;
  const base = {
    ...baseEnv,
    CART_COOKIE_SECRET: "secret",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  describe("CART_TTL", () => {
    it.each([
      ["123", 123],
      ["1.5", 1.5],
      ["-2", -2],
      ["0", 0],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, CART_TTL: input };
      const { loadCoreEnv } = await import("../core.ts");
      const env = loadCoreEnv();
      expect(env.CART_TTL).toBe(expected);
    });

    it("defaults when missing", async () => {
      process.env = { ...base };
      const { loadCoreEnv } = await import("../core.ts");
      const env = loadCoreEnv();
      expect(env.CART_TTL).toBeUndefined();
    });

    it.each(["abc", "NaN"])("rejects %s", async (input) => {
      process.env = { ...base, CART_TTL: input };
      const { loadCoreEnv } = await import("../core.ts");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });

  describe("DEPOSIT_RELEASE_INTERVAL_MS", () => {
    it.each([
      ["1000", 1000],
      ["1.5", 1.5],
      ["-5", -5],
      ["0", 0],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, DEPOSIT_RELEASE_INTERVAL_MS: input };
      const { loadCoreEnv } = await import("../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(expected);
    });

    it("defaults when missing", async () => {
      process.env = { ...base };
      const { loadCoreEnv } = await import("../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBeUndefined();
    });

    it.each(["abc", "NaN"])("rejects %s", async (input) => {
      process.env = { ...base, DEPOSIT_RELEASE_INTERVAL_MS: input };
      const { loadCoreEnv } = await import("../core.ts");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });
});

describe("NODE_ENV branches", () => {
  const ORIGINAL_ENV = process.env;
  const base = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
    EMAIL_FROM: "test@example.com",
    EMAIL_PROVIDER: "smtp",
  };

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it.each(["development", "test"]) (
    "defaults CART_COOKIE_SECRET in %s",
    async (env) => {
      process.env = { ...base, NODE_ENV: env } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { loadCoreEnv } = await import("../core.ts");
      const parsed = loadCoreEnv();
      expect(parsed.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    },
  );

  it("requires CART_COOKIE_SECRET in production", async () => {
    process.env = {
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { loadCoreEnv } = await import("../core.ts");
    const env = { ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    delete env.CART_COOKIE_SECRET;
    expect(() => loadCoreEnv(env)).toThrow(
      "Invalid core environment variables",
    );
  });

  it("fails fast on invalid env in production", async () => {
    process.env = { ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    jest.resetModules();
    await expect(import("../core.ts")).rejects.toThrow(
      "Invalid core environment variables",
    );
  });
});

describe("coreEnv proxy NODE_ENV behavior", () => {
  const ORIGINAL_ENV = process.env;
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

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it.each(["development", "test"]) (
    "lazy loads in %s",
    async (env) => {
      process.env = { ...base, NODE_ENV: env } as NodeJS.ProcessEnv;
      jest.resetModules();
      const mod = await import("../core.ts");
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
    const mod = await import("../core.ts");
    const loadSpy = jest.spyOn(mod, "loadCoreEnv");
    loadSpy.mockClear();
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(loadSpy).not.toHaveBeenCalled();
  });
});

describe("loadCoreEnv fallback precedence", () => {
  const base = {
    CMS_SPACE_URL: "https://cms.example.com",
    SANITY_API_VERSION: "v1",
  };

  it("prefers process.env over .env defaults over code defaults", () => {
    const dotenvDefaults = { CMS_ACCESS_TOKEN: "from-dotenv" };
    const explicit = { CMS_ACCESS_TOKEN: "from-process" };

    const withCodeDefault = loadCoreEnv({ ...base } as NodeJS.ProcessEnv);
    expect(withCodeDefault.CMS_ACCESS_TOKEN).toBe("placeholder-token");

    const withDotenv = loadCoreEnv({
      ...dotenvDefaults,
      ...base,
    } as NodeJS.ProcessEnv);
    expect(withDotenv.CMS_ACCESS_TOKEN).toBe("from-dotenv");

    const withProcess = loadCoreEnv({
      ...dotenvDefaults,
      ...explicit,
      ...base,
    } as NodeJS.ProcessEnv);
    expect(withProcess.CMS_ACCESS_TOKEN).toBe("from-process");
  });
});

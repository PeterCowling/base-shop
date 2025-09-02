import { afterEach, describe, expect, it } from "@jest/globals";
import { z } from "zod";
import {
  coreEnvBaseSchema,
  depositReleaseEnvRefinement,
  loadCoreEnv,
} from "../core.js";

const schema = coreEnvBaseSchema.superRefine(depositReleaseEnvRefinement);

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

describe("depositReleaseEnvRefinement", () => {
  it("flags invalid ENABLED and INTERVAL_MS values", () => {
    const ctx = { addIssue: jest.fn() } as unknown as z.RefinementCtx;
    depositReleaseEnvRefinement(
      {
        DEPOSIT_RELEASE_FOO_ENABLED: "maybe",
        DEPOSIT_RELEASE_FOO_INTERVAL_MS: "soon",
      },
      ctx,
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_FOO_ENABLED"],
        message: "must be true or false",
      }),
    );
    expect(ctx.addIssue).toHaveBeenCalledWith(
      expect.objectContaining({
        path: ["DEPOSIT_RELEASE_FOO_INTERVAL_MS"],
        message: "must be a number",
      }),
    );
    expect((ctx.addIssue as jest.Mock).mock.calls).toHaveLength(2);
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
    const env = {
      ...baseEnv,
      DEPOSIT_RELEASE_ENABLED: "yes",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => loadCoreEnv(env)).toThrow(
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

describe("coreEnv proxy", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("caches results and parses only once", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      ...baseEnv,
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = await import("../core.js");
    const spy = jest.spyOn(mod, "loadCoreEnv");
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(mod.coreEnv.CMS_ACCESS_TOKEN).toBe("token");
    // Second access uses cached env
    expect(mod.coreEnv.SANITY_API_VERSION).toBe("v1");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("core env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
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
});


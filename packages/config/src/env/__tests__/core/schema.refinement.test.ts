/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";
import {
  coreEnvBaseSchema,
  coreEnvSchema,
  depositReleaseEnvRefinement,
  loadCoreEnv,
} from "../../core.ts";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
};

const schema = coreEnvBaseSchema.superRefine(depositReleaseEnvRefinement);

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
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
    const { coreEnvSchema } = await import("../../core.ts");
    const { authEnvSchema } = await import("../../auth.ts");
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

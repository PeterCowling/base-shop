/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";

import {
  expectInvalidAuthEnv,
  expectInvalidProd,
  loadAuthSchema,
  loadProd,
  loadProdSchema,
  prodEnv,
  prodSecrets,
  STRONG_TOKEN,
} from "./authTestHelpers";

const redisEnv = {
  SESSION_STORE: "redis",
  UPSTASH_REDIS_REST_URL: "https://example.com",
  UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
} as const;

const rateLimitBase = {
  LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
  LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
} as const;

describe("redis session store configuration", () => {
  it("throws when redis session store credentials missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { SESSION_STORE: "redis", UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: undefined },
      (env) => env.UPSTASH_REDIS_REST_URL,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        UPSTASH_REDIS_REST_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("returns errors when redis session store credentials missing", async () => {
    const { authEnvSchema } = await loadProd();
    const result = authEnvSchema.safeParse({
      ...prodSecrets,
      SESSION_STORE: "redis",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      UPSTASH_REDIS_REST_URL: {
        _errors: [
          "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
        ],
      },
      UPSTASH_REDIS_REST_TOKEN: {
        _errors: [
          "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
        ],
      },
    });
  });

  it("throws when UPSTASH_REDIS_REST_URL is missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { ...redisEnv, UPSTASH_REDIS_REST_URL: undefined },
      (env) => env.UPSTASH_REDIS_REST_URL,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when UPSTASH_REDIS_REST_TOKEN is missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { ...redisEnv, UPSTASH_REDIS_REST_TOKEN: undefined },
      (env) => env.UPSTASH_REDIS_REST_TOKEN,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("parses redis session store credentials when provided", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const auth = await loadAuthSchema(prodEnv(redisEnv));
    expect(auth.safeParse({ ...prodSecrets, ...redisEnv }).success).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("logs error when SESSION_STORE=redis without URL", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      },
      (env) => env.SESSION_STORE,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_URL: {
          _errors: ["UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis"],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("logs error when SESSION_STORE=redis without token", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
        UPSTASH_REDIS_REST_TOKEN: undefined,
      },
      (env) => env.SESSION_STORE,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_TOKEN: {
          _errors: ["UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis"],
        },
      }),
    );
    errorSpy.mockRestore();
  });
});

describe("auth redis schema dependencies", () => {
  it("requires redis credentials for SESSION_STORE=redis", async () => {
    const schema = await loadProdSchema();
    const result = schema.safeParse({
      ...prodSecrets,
      SESSION_STORE: "redis",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      UPSTASH_REDIS_REST_URL: {
        _errors: ["UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis"],
      },
      UPSTASH_REDIS_REST_TOKEN: {
        _errors: ["UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis"],
      },
    });
  });
});

describe("login rate limit redis configuration", () => {
  it("returns error when LOGIN_RATE_LIMIT_REDIS_TOKEN missing", async () => {
    const { authEnvSchema } = await loadProd();
    const result = authEnvSchema.safeParse({
      ...prodSecrets,
      LOGIN_RATE_LIMIT_REDIS_URL: rateLimitBase.LOGIN_RATE_LIMIT_REDIS_URL,
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_TOKEN: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
        ],
      },
    });
  });

  it("returns error when LOGIN_RATE_LIMIT_REDIS_URL missing", async () => {
    const { authEnvSchema } = await loadProd();
    const result = authEnvSchema.safeParse({
      ...prodSecrets,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: rateLimitBase.LOGIN_RATE_LIMIT_REDIS_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_URL: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
        ],
      },
    });
  });

  it("parses rate limit redis configuration", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { authEnv } = await loadProd({ ...rateLimitBase });
    expect(authEnv).toMatchObject(rateLimitBase);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws when LOGIN_RATE_LIMIT_REDIS_TOKEN is set without URL", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { ...rateLimitBase, LOGIN_RATE_LIMIT_REDIS_URL: undefined },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_URL,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: {
          _errors: [
            "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
          ],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when LOGIN_RATE_LIMIT_REDIS_URL is set without token", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { ...rateLimitBase, LOGIN_RATE_LIMIT_REDIS_TOKEN: undefined },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_TOKEN: {
          _errors: [
            "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
          ],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_URL set without token", async () => {
    const schema = await loadProdSchema();
    const result = schema.safeParse({
      ...prodSecrets,
      LOGIN_RATE_LIMIT_REDIS_URL: rateLimitBase.LOGIN_RATE_LIMIT_REDIS_URL,
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_TOKEN: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
        ],
      },
    });
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_TOKEN set without URL", async () => {
    const schema = await loadProdSchema();
    const result = schema.safeParse({
      ...prodSecrets,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: rateLimitBase.LOGIN_RATE_LIMIT_REDIS_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      LOGIN_RATE_LIMIT_REDIS_URL: {
        _errors: [
          "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
        ],
      },
    });
  });
});

describe("optional URL validation", () => {
  it("throws when optional URLs are invalid", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { LOGIN_RATE_LIMIT_REDIS_URL: "not-a-url" },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_URL,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when optional URL invalid and NEXTAUTH_SECRET is missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidAuthEnv(
      prodEnv({ NEXTAUTH_SECRET: undefined, LOGIN_RATE_LIMIT_REDIS_URL: "not-a-url" }),
      (env) => env.LOGIN_RATE_LIMIT_REDIS_URL,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });
});

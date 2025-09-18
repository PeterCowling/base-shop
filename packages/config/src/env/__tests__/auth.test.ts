/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";

import { withEnv } from "../../../test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../../../test/utils/expectInvalidAuthEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const DEV_NEXT_SECRET = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION_SECRET = "dev-session-secret-32-chars-long-string!";
const STRONG_TOKEN = "token-value-32-chars-long-string!!";
const JWT_SECRET = "jwt-secret-32-chars-long-string!!!";
const OAUTH_SECRET = "oauth-secret-32-chars-long-string!!";

type EnvOverrides = Record<string, string | undefined>;

const baseProdEnv: EnvOverrides = {
  NODE_ENV: "production",
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
};

const baseDevEnv: EnvOverrides = {
  NODE_ENV: "development",
};

const baseTestEnv: EnvOverrides = {
  NODE_ENV: "test",
};

const prodEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  ...baseProdEnv,
  ...overrides,
});

const devEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  ...baseDevEnv,
  ...overrides,
});

const testEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  ...baseTestEnv,
  ...overrides,
});

const loadAuthModule = (env: EnvOverrides) => withEnv(env, () => import("../auth.ts"));

const expectInvalid = async (
  env: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: jest.SpyInstance,
) =>
  expectInvalidAuth({
    env,
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

const loadProd = (overrides: EnvOverrides = {}) => loadAuthModule(prodEnv(overrides));

const expectInvalidProd = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: jest.SpyInstance,
) => expectInvalid(prodEnv(overrides), accessor, consoleErrorSpy);

const getProdAuthEnv = async (overrides: EnvOverrides = {}) => (await loadProd(overrides)).authEnv;

afterEach(() => {
  jest.restoreAllMocks();
});

describe("auth env module", () => {

  it("parses valid configuration", async () => {
    const { authEnv } = await loadAuthModule(prodEnv());
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
    });
  });

  it("defaults secrets in development", async () => {
    const { authEnv } = await loadAuthModule(
      devEnv({
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET: undefined,
        PREVIEW_TOKEN_SECRET: undefined,
      }),
    );
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: DEV_NEXT_SECRET,
      SESSION_SECRET: DEV_SESSION_SECRET,
    });
    expect(authEnv.PREVIEW_TOKEN_SECRET).toBeUndefined();
  });

  it("defaults NEXTAUTH_SECRET in development when missing", async () => {
    const { authEnv } = await loadAuthModule(
      devEnv({
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET,
      }),
    );
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: DEV_NEXT_SECRET,
      SESSION_SECRET,
    });
  });

  it("defaults SESSION_SECRET in development when missing", async () => {
    const { authEnv } = await loadAuthModule(
      devEnv({
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: undefined,
      }),
    );
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET: DEV_SESSION_SECRET,
    });
  });

  it("throws when secrets are empty in non-production", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      testEnv({ NEXTAUTH_SECRET: "", SESSION_SECRET: "" }),
      (env) => env.NEXTAUTH_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws on missing required configuration", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ NEXTAUTH_SECRET: undefined, SESSION_SECRET: undefined }),
      (env) => env.NEXTAUTH_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when NEXTAUTH_SECRET is missing in production", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ NEXTAUTH_SECRET: undefined }),
      (env) => env.NEXTAUTH_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when SESSION_SECRET is missing in production", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(prodEnv({ SESSION_SECRET: undefined }), (env) => env.SESSION_SECRET, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when required secrets are empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ NEXTAUTH_SECRET: "", SESSION_SECRET: "" }),
      (env) => env.NEXTAUTH_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("fails safeParse for missing required secrets", async () => {
    const { authEnvSchema } = await loadAuthModule(prodEnv());
    const result = authEnvSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
    });
    expect(() => authEnvSchema.parse({})).toThrow();
  });

  it("throws when SESSION_STORE is invalid", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ SESSION_STORE: "postgres" }),
      (env) => env.SESSION_STORE,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        SESSION_STORE: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when redis session store credentials are missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
      }),
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
    const { authEnvSchema } = await loadAuthModule(prodEnv());
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
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

  describe("redis session store configuration", () => {
    const redisEnv = {
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
      UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
    } as const;

    it("throws when UPSTASH_REDIS_REST_URL is missing", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalid(
        prodEnv({ ...redisEnv, UPSTASH_REDIS_REST_URL: undefined }),
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
      await expectInvalid(
        prodEnv({ ...redisEnv, UPSTASH_REDIS_REST_TOKEN: undefined }),
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

    it("parses when redis session store credentials provided", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const { authEnv } = await loadAuthModule(prodEnv(redisEnv));
      expect(authEnv).toMatchObject({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: redisEnv.UPSTASH_REDIS_REST_URL,
        UPSTASH_REDIS_REST_TOKEN: redisEnv.UPSTASH_REDIS_REST_TOKEN,
      });
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  it("returns error when LOGIN_RATE_LIMIT_REDIS_TOKEN missing", async () => {
    const { authEnvSchema } = await loadProd();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
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
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
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

  const rateLimitBase = {
    LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
    LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
  } as const;

  it("parses rate limit redis configuration", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { authEnv } = await loadAuthModule(prodEnv(rateLimitBase));
    expect(authEnv).toMatchObject(rateLimitBase);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws when LOGIN_RATE_LIMIT_REDIS_TOKEN is set without URL", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ ...rateLimitBase, LOGIN_RATE_LIMIT_REDIS_URL: undefined }),
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
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("throws when LOGIN_RATE_LIMIT_REDIS_URL is set without token", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ ...rateLimitBase, LOGIN_RATE_LIMIT_REDIS_TOKEN: undefined }),
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
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("throws when optional URLs are invalid", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ LOGIN_RATE_LIMIT_REDIS_URL: "not-a-url" }),
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

  it("throws when optional URL is invalid and NEXTAUTH_SECRET is missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
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

  it("logs error when SESSION_STORE=redis without UPSTASH_REDIS_REST_URL", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ SESSION_STORE: "redis", UPSTASH_REDIS_REST_URL: undefined, UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN }),
      (env) => env.SESSION_STORE,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_URL: {
          _errors: [
            "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
          ],
        },
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("logs error when SESSION_STORE=redis without UPSTASH_REDIS_REST_TOKEN", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ SESSION_STORE: "redis", UPSTASH_REDIS_REST_URL: "https://example.com", UPSTASH_REDIS_REST_TOKEN: undefined }),
      (env) => env.SESSION_STORE,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        UPSTASH_REDIS_REST_TOKEN: {
          _errors: [
            "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
          ],
        },
      }),
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_URL set without token", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalid(
      prodEnv({ LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com", LOGIN_RATE_LIMIT_REDIS_TOKEN: undefined }),
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
    expect(errorSpy).toHaveBeenCalledTimes(1);
    errorSpy.mockRestore();
  });

});

describe("authEnvSchema", () => {
  const loadSchema = async () => (await loadProd()).authEnvSchema;

  it("errors when redis session store URL is missing", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      UPSTASH_REDIS_REST_URL: {
        _errors: [
          "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
        ],
      },
    });
  });

  it("errors when redis session store token is missing", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      UPSTASH_REDIS_REST_TOKEN: {
        _errors: [
          "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
        ],
      },
    });
  });

  it("errors when LOGIN_RATE_LIMIT_REDIS_URL is set without token", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
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

  it("errors when LOGIN_RATE_LIMIT_REDIS_TOKEN is set without URL", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
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

  it("parses valid redis configuration", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
      UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
    });
    expect(result.success).toBe(true);
  });
});

describe("auth providers and tokens", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("parses local provider without extra secrets", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_PROVIDER: "local" });
    expect(authEnv.AUTH_PROVIDER).toBe("local");
    expect(authEnv.JWT_SECRET).toBeUndefined();
    expect(authEnv.OAUTH_CLIENT_ID).toBeUndefined();
    expect(authEnv.OAUTH_CLIENT_SECRET).toBeUndefined();
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:15:00.000Z",
    );
    expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
    expect(authEnv.TOKEN_AUDIENCE).toBe("base-shop");
    expect(authEnv.TOKEN_ISSUER).toBe("base-shop");
    expect(authEnv.ALLOW_GUEST).toBe(false);
    expect(authEnv.ENFORCE_2FA).toBe(false);
  });

  it("parses jwt provider when secret present", async () => {
    const authEnv = await getProdAuthEnv({ AUTH_PROVIDER: "jwt", JWT_SECRET });
    expect(authEnv.JWT_SECRET).toBe(JWT_SECRET);
  });

  it("throws when JWT_SECRET missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_PROVIDER: "jwt", JWT_SECRET: undefined }, (env) => env.JWT_SECRET, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when JWT_SECRET empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_PROVIDER: "jwt", JWT_SECRET: "" }, (env) => env.JWT_SECRET, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("parses oauth provider with credentials", async () => {
    const authEnv = await getProdAuthEnv({
      AUTH_PROVIDER: "oauth",
      OAUTH_CLIENT_ID: "id",
      OAUTH_CLIENT_SECRET: OAUTH_SECRET,
    });
    expect(authEnv.OAUTH_CLIENT_ID).toBe("id");
    expect(authEnv.OAUTH_CLIENT_SECRET).toBe(OAUTH_SECRET);
  });

  it("throws when oauth credentials are missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_PROVIDER: "oauth" }, (env) => env.OAUTH_CLIENT_ID, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_ID: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
        OAUTH_CLIENT_SECRET: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_ID missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_SECRET: OAUTH_SECRET, OAUTH_CLIENT_ID: undefined },
      (env) => env.OAUTH_CLIENT_ID,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_ID: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_SECRET missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "id", OAUTH_CLIENT_SECRET: undefined },
      (env) => env.OAUTH_CLIENT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("normalizes AUTH_TOKEN_TTL strings", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "15m" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:15:00.000Z",
    );
  });

  it("allows zero-second TTL", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "0s" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(0);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:00:00.000Z",
    );
  });

  it("errors on malformed TTL string", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_TOKEN_TTL: "abc" }, (env) => env.AUTH_TOKEN_TTL, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        AUTH_TOKEN_TTL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("errors on negative TTL input", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_TOKEN_TTL: "-5s" }, (env) => env.AUTH_TOKEN_TTL, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        AUTH_TOKEN_TTL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("normalizes numeric AUTH_TOKEN_TTL without unit", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "60" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:01:00.000Z",
    );
  });

  it("normalizes AUTH_TOKEN_TTL with whitespace and unit", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: " 5 m " });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(300);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:05:00.000Z",
    );
  });

  it("defaults AUTH_TOKEN_TTL when blank", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "   " });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:15:00.000Z",
    );
  });

  it("allows HS256 algorithm", async () => {
    const authEnv = await getProdAuthEnv({ TOKEN_ALGORITHM: "HS256" });
    expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
  });

  it("allows RS256 algorithm", async () => {
    const authEnv = await getProdAuthEnv({ TOKEN_ALGORITHM: "RS256" });
    expect(authEnv.TOKEN_ALGORITHM).toBe("RS256");
  });

  it("errors on unsupported algorithm", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ TOKEN_ALGORITHM: "none" }, (env) => env.TOKEN_ALGORITHM, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        TOKEN_ALGORITHM: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("uses default token audience and issuer", async () => {
    const authEnv = await getProdAuthEnv();
    expect(authEnv.TOKEN_AUDIENCE).toBe("base-shop");
    expect(authEnv.TOKEN_ISSUER).toBe("base-shop");
  });

  it("overrides token audience and issuer", async () => {
    const authEnv = await getProdAuthEnv({
      TOKEN_AUDIENCE: "custom-aud",
      TOKEN_ISSUER: "custom-iss",
    });
    expect(authEnv.TOKEN_AUDIENCE).toBe("custom-aud");
    expect(authEnv.TOKEN_ISSUER).toBe("custom-iss");
  });

  it("parses boolean toggles", async () => {
    const authEnv = await getProdAuthEnv({
      ALLOW_GUEST: "true",
      ENFORCE_2FA: "true",
    });
    expect(authEnv.ALLOW_GUEST).toBe(true);
    expect(authEnv.ENFORCE_2FA).toBe(true);
  });

  it("uses memory session store without redis config", async () => {
    const authEnv = await getProdAuthEnv({ SESSION_STORE: "memory" });
    expect(authEnv.SESSION_STORE).toBe("memory");
  });
});

  it("throws when OAUTH_CLIENT_SECRET missing", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "id", OAUTH_CLIENT_SECRET: undefined },
      (env) => env.OAUTH_CLIENT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_SECRET: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_ID empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "", OAUTH_CLIENT_SECRET: OAUTH_SECRET },
      (env) => env.OAUTH_CLIENT_ID,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_ID: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when OAUTH_CLIENT_SECRET empty", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd(
      { AUTH_PROVIDER: "oauth", OAUTH_CLIENT_ID: "id", OAUTH_CLIENT_SECRET: "" },
      (env) => env.OAUTH_CLIENT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        OAUTH_CLIENT_SECRET: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("parses TTL in seconds", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "60s" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:01:00.000Z",
    );
  });

  it("parses TTL in minutes", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "15m" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:15:00.000Z",
    );
  });

  it("errors on malformed TTL string", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_TOKEN_TTL: "abc" }, (env) => env.AUTH_TOKEN_TTL, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        AUTH_TOKEN_TTL: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });


  it("parses zero TTL", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "0s" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(0);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:00:00.000Z",
    );
  });

  it("errors on negative TTL input", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ AUTH_TOKEN_TTL: "-5s" }, (env) => env.AUTH_TOKEN_TTL, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        AUTH_TOKEN_TTL: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("normalizes numeric AUTH_TOKEN_TTL without unit", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "60" });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:01:00.000Z",
    );
  });

  it("normalizes AUTH_TOKEN_TTL with whitespace and unit", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: " 5 m " });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(300);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:05:00.000Z",
    );
  });

  it("defaults AUTH_TOKEN_TTL when blank", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const authEnv = await getProdAuthEnv({ AUTH_TOKEN_TTL: "   " });
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:15:00.000Z",
    );
  });

  it("allows HS256 algorithm", async () => {
    const authEnv = await getProdAuthEnv({ TOKEN_ALGORITHM: "HS256" });
    expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
  });

  it("allows RS256 algorithm", async () => {
    const authEnv = await getProdAuthEnv({ TOKEN_ALGORITHM: "RS256" });
    expect(authEnv.TOKEN_ALGORITHM).toBe("RS256");
  });

  it("errors on unsupported algorithm", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ TOKEN_ALGORITHM: "none" }, (env) => env.TOKEN_ALGORITHM, errorSpy);
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        TOKEN_ALGORITHM: {
          _errors: expect.arrayContaining([expect.any(String)]),
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("uses default token audience and issuer", async () => {
    const authEnv = await getProdAuthEnv();
    expect(authEnv.TOKEN_AUDIENCE).toBe("base-shop");
    expect(authEnv.TOKEN_ISSUER).toBe("base-shop");
  });

  it("overrides token audience and issuer", async () => {
    const authEnv = await getProdAuthEnv({
      TOKEN_AUDIENCE: "custom-aud",
      TOKEN_ISSUER: "custom-iss",
    });
    expect(authEnv.TOKEN_AUDIENCE).toBe("custom-aud");
    expect(authEnv.TOKEN_ISSUER).toBe("custom-iss");
  });

  it("parses boolean toggles", async () => {
    const authEnv = await getProdAuthEnv({
      ALLOW_GUEST: "true",
      ENFORCE_2FA: "true",
    });
    expect(authEnv.ALLOW_GUEST).toBe(true);
    expect(authEnv.ENFORCE_2FA).toBe(true);
  });

  it("uses memory session store without redis config", async () => {
    const authEnv = await getProdAuthEnv({ SESSION_STORE: "memory" });
    expect(authEnv.SESSION_STORE).toBe("memory");
  });
});

describe("auth schema dependency validation", () => {
  const loadSchema = async () => (await loadProd()).authEnvSchema;

  it("requires redis credentials for SESSION_STORE=redis", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
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

  it("requires LOGIN_RATE_LIMIT_REDIS_TOKEN when URL provided", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
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

  it("requires LOGIN_RATE_LIMIT_REDIS_URL when token provided", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
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

  it("requires JWT_SECRET for AUTH_PROVIDER=jwt", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      AUTH_PROVIDER: "jwt",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      JWT_SECRET: {
        _errors: [
          "JWT_SECRET is required when AUTH_PROVIDER=jwt",
        ],
      },
    });
  });

  it("requires oauth client credentials for AUTH_PROVIDER=oauth", async () => {
    const authEnvSchema = await loadSchema();
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      AUTH_PROVIDER: "oauth",
    });
    expect(result.success).toBe(false);
    expect(result.error.format()).toMatchObject({
      OAUTH_CLIENT_ID: {
        _errors: [
          "OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth",
        ],
      },
      OAUTH_CLIENT_SECRET: {
        _errors: [
          "OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth",
        ],
      },
    });
  });
});

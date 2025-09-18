import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv } from "../../../config/test/utils/expectInvalidAuthEnv";

const REDIS_URL = "https://example.com";
const STRONG_TOKEN = "redis-token-32-chars-long-string!";

type EnvOverrides = Record<string, string | undefined>;

const devEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: "development",
  ...overrides,
});

const expectInvalidDev = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: jest.SpyInstance,
) =>
  expectInvalidAuthEnvWithConfigEnv({
    env: devEnv(overrides),
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

describe("auth env validation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("normalises AUTH_TOKEN_TTL values", async () => {
    const result = await withEnv(
      devEnv({ AUTH_TOKEN_TTL: " 5 m " }),
      async () => {
        const mod = await import("@acme/config/src/env/auth.ts");
        return { ...mod, ttl: process.env.AUTH_TOKEN_TTL };
      },
    );
    expect(result.ttl).toBe("5m");
    expect(result.authEnv.AUTH_TOKEN_TTL).toBe(300);
  });

  it("requires both redis credentials when SESSION_STORE=redis (missing token)", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidDev(
      {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
      },
      (env) => env.UPSTASH_REDIS_REST_TOKEN,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.UPSTASH_REDIS_REST_TOKEN?._errors[0]).toContain(
      "UPSTASH_REDIS_REST_TOKEN is required",
    );
    errorSpy.mockRestore();
  });

  it("requires both redis credentials when SESSION_STORE=redis (missing url)", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidDev(
      {
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      },
      (env) => env.UPSTASH_REDIS_REST_URL,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.UPSTASH_REDIS_REST_URL?._errors[0]).toContain(
      "UPSTASH_REDIS_REST_URL is required",
    );
    errorSpy.mockRestore();
  });

  it("accepts redis store when credentials provided", async () => {
    const { authEnv } = await withEnv(
      devEnv({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      }),
      () => import("@acme/config/src/env/auth.ts"),
    );
    expect(authEnv.SESSION_STORE).toBe("redis");
  });

  it("requires both login rate limit redis credentials (missing token)", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidDev(
      {
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
      },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.LOGIN_RATE_LIMIT_REDIS_TOKEN?._errors[0]).toContain(
      "LOGIN_RATE_LIMIT_REDIS_TOKEN is required",
    );
    errorSpy.mockRestore();
  });

  it("requires both login rate limit redis credentials (missing url)", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidDev(
      {
        LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
      },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_URL,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.LOGIN_RATE_LIMIT_REDIS_URL?._errors[0]).toContain(
      "LOGIN_RATE_LIMIT_REDIS_URL is required",
    );
    errorSpy.mockRestore();
  });

  it("throws for jwt provider without secret", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidDev({ AUTH_PROVIDER: "jwt" }, (env) => env.JWT_SECRET, errorSpy);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loads for jwt provider with secret", async () => {
    const { authEnv } = await withEnv(
      devEnv({ AUTH_PROVIDER: "jwt", JWT_SECRET: STRONG_TOKEN }),
      () => import("@acme/config/src/env/auth.ts"),
    );
    expect(authEnv.JWT_SECRET).toBe(STRONG_TOKEN);
  });

  it("throws for oauth provider missing client id", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidDev(
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
      },
      (env) => env.OAUTH_CLIENT_ID,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws for oauth provider missing client secret", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidDev(
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
      },
      (env) => env.OAUTH_CLIENT_SECRET,
      errorSpy,
    );
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loads when oauth provider has credentials", async () => {
    const { authEnv } = await withEnv(
      devEnv({
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
      }),
      () => import("@acme/config/src/env/auth.ts"),
    );
    expect(authEnv.AUTH_PROVIDER).toBe("oauth");
    expect(authEnv.OAUTH_CLIENT_ID).toBe("client-id");
  });
});

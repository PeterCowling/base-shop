import { afterEach, describe, expect, it } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv } from "../../../config/test/utils/expectInvalidAuthEnv";

const REDIS_URL = "https://redis.example.com";
const STRONG_TOKEN = "strongtokenstrongtokenstrongtoken!!";
const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const OAUTH_ISSUER = "https://auth.example.com/realms/base-shop";
const OAUTH_REDIRECT_ORIGIN = "https://shop.example.com";

type EnvOverrides = Record<string, string | undefined>;

const prodEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: "production",
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...overrides,
});

const devEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: "development",
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...overrides,
});

const asProcessEnv = (env: EnvOverrides): NodeJS.ProcessEnv =>
  env as unknown as NodeJS.ProcessEnv;

const expectInvalidProd = (
  overrides: EnvOverrides,
  consoleErrorSpy?: jest.SpyInstance,
) =>
  expectInvalidAuthEnvWithConfigEnv({
    env: asProcessEnv(prodEnv(overrides)),
    accessor: (auth) => auth.authEnv.AUTH_PROVIDER,
    consoleErrorSpy,
  });

afterEach(() => {
  jest.restoreAllMocks();
});

describe("AUTH_TOKEN_TTL normalisation", () => {
  it("trims and converts minutes to seconds", async () => {
    const { authEnv, normalized } = await withEnv(
      asProcessEnv(devEnv({ AUTH_TOKEN_TTL: " 5 m " })),
      async () => {
        const mod = await import("@acme/config/env/auth");
        return { authEnv: mod.authEnv, normalized: process.env.AUTH_TOKEN_TTL };
      },
    );

    expect(authEnv.AUTH_TOKEN_TTL).toBe(300);
    expect(normalized).toBe("5m");
  });
});

describe("redis session store requirements", () => {
  it("requires redis token", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidProd(
        {
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: REDIS_URL,
        },
        spy,
      );
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_TOKEN: {
            _errors: expect.arrayContaining([
              "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
            ]),
          },
        }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("requires redis url", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidProd(
        {
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        },
        spy,
      );
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_URL: {
            _errors: expect.arrayContaining([
              "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
            ]),
          },
        }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("parses redis config when url and token present", async () => {
    const { authEnv } = await withEnv(
      asProcessEnv(prodEnv({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      })),
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.SESSION_STORE).toBe("redis");
  });
});

describe("rate limit redis credentials", () => {
  it("requires token when url provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidProd({ LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL }, spy);
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          LOGIN_RATE_LIMIT_REDIS_TOKEN: {
            _errors: expect.arrayContaining([
              "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
            ]),
          },
        }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("requires url when token provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidProd({ LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN }, spy);
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          LOGIN_RATE_LIMIT_REDIS_URL: {
            _errors: expect.arrayContaining([
              "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
            ]),
          },
        }),
      );
    } finally {
      spy.mockRestore();
    }
  });
});

describe("auth provider specific checks", () => {
  it("requires JWT_SECRET for jwt provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidProd({ AUTH_PROVIDER: "jwt" }, spy);
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: {
            _errors: expect.arrayContaining([
              "JWT_SECRET is required when AUTH_PROVIDER=jwt",
            ]),
          },
        }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("parses jwt provider when secret present", async () => {
    const { authEnv } = await withEnv(
      asProcessEnv(prodEnv({ AUTH_PROVIDER: "jwt", JWT_SECRET: STRONG_TOKEN })),
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.AUTH_PROVIDER).toBe("jwt");
  });

  it("requires OAUTH_CLIENT_ID for oauth provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidProd(
        {
          AUTH_PROVIDER: "oauth",
          OAUTH_CLIENT_SECRET: STRONG_TOKEN,
        },
        spy,
      );
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          OAUTH_CLIENT_ID: {
            _errors: expect.arrayContaining([
              "OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth",
            ]),
          },
        }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("requires OAUTH_CLIENT_SECRET for oauth provider", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidProd(
        {
          AUTH_PROVIDER: "oauth",
          OAUTH_CLIENT_ID: "client-id",
        },
        spy,
      );
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          OAUTH_CLIENT_SECRET: {
            _errors: expect.arrayContaining([
              "OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth",
            ]),
          },
        }),
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("parses oauth provider when credentials present", async () => {
    const { authEnv } = await withEnv(
      asProcessEnv({
        OAUTH_ISSUER,
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
        OAUTH_REDIRECT_ORIGIN,
      }),
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.AUTH_PROVIDER).toBe("oauth");
  });
});

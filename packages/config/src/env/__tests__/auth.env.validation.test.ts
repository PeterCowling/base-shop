/** @jest-environment node */
import { describe, expect, it, jest } from "@jest/globals";
import { createExpectInvalidAuthEnv } from "../../../test/utils/expectInvalidAuthEnv";
import { withEnv } from "./test-helpers";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const REDIS_URL = "https://example.com";
const REDIS_TOKEN = "redis-token-32-chars-long-string!";
const JWT_SECRET = "jwt-secret-32-chars-long-string!!!";
const OAUTH_CLIENT_ID = "client-id";
const OAUTH_CLIENT_SECRET = "oauth-client-secret-32-chars-long-string!!";
const OAUTH_ISSUER = "https://auth.example.com/realms/base-shop";
const OAUTH_REDIRECT_ORIGIN = "https://shop.example.com";

const expectInvalidAuth = createExpectInvalidAuthEnv(withEnv);

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
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...overrides,
});

const expectInvalidProd = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: jest.SpyInstance,
) =>
  expectInvalidAuth({
    env: prodEnv(overrides),
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

const base = prodEnv();

describe("boolean coercion", () => {
  describe.each(["ALLOW_GUEST", "ENFORCE_2FA"] as const)("%s", (key) => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
    ])("parses %s", async (input, expected) => {
      await withEnv(prodEnv({ [key]: input } as EnvOverrides), async () => {
        const { authEnv } = await import("../auth");
        expect(authEnv[key]).toBe(expected);
      });
    });

    it("errors on empty string", async () => {
      await expectInvalidProd({ [key]: "" } as EnvOverrides, (env) => env[key]);
    });

    it("errors on unrecognized string", async () => {
      await expectInvalidProd({ [key]: "notabool" } as EnvOverrides, (env) => env[key]);
    });
  });
});

describe("SESSION_STORE redis requirements", () => {
  const baseRedis = prodEnv({ SESSION_STORE: "redis" as const });
  it.each([
    ["missing both", {}, ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]],
    [
      "missing token",
      { UPSTASH_REDIS_REST_URL: REDIS_URL },
      ["UPSTASH_REDIS_REST_TOKEN"],
    ],
    [
      "missing url",
      { UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN },
      ["UPSTASH_REDIS_REST_URL"],
    ],
  ])("fails when %s", async (_label, extra, missing) => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ SESSION_STORE: "redis", ...extra }, (env) => env.SESSION_STORE, spy);
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    for (const key of missing) {
      expect(errorObj).toHaveProperty(key);
    }
    spy.mockRestore();
  });

  it.each([
    [
      "blank token",
      {
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: "",
      },
      ["UPSTASH_REDIS_REST_TOKEN"],
    ],
    [
      "blank url",
      {
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      ["UPSTASH_REDIS_REST_URL"],
    ],
  ])("fails when %s", async (_label, extra, missing) => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ SESSION_STORE: "redis", ...extra }, (env) => env.SESSION_STORE, spy);
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    for (const key of missing) {
      expect(errorObj).toHaveProperty(key);
    }
    spy.mockRestore();
  });

  it("passes when credentials provided", async () => {
    await withEnv(
      {
        ...baseRedis,
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      async () => {
        const { authEnv } = await import("../auth");
        expect(authEnv.SESSION_STORE).toBe("redis");
      },
    );
  });
});

describe("login rate limit redis credentials", () => {
  it.each([
    [
      "URL only",
      { LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL },
      ["LOGIN_RATE_LIMIT_REDIS_TOKEN"],
    ],
    [
      "token only",
      { LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN },
      ["LOGIN_RATE_LIMIT_REDIS_URL"],
    ],
    [
      "URL blank",
      {
        LOGIN_RATE_LIMIT_REDIS_URL: "",
        LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
      },
      ["LOGIN_RATE_LIMIT_REDIS_URL"],
    ],
    [
      "token blank",
      {
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
        LOGIN_RATE_LIMIT_REDIS_TOKEN: "",
      },
      ["LOGIN_RATE_LIMIT_REDIS_TOKEN"],
    ],
  ])("errors with %s", async (_label, extra, missing) => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  await expectInvalidProd(
    extra,
    (env) => env.LOGIN_RATE_LIMIT_REDIS_URL ?? env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
    spy,
  );
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    for (const key of missing) {
      expect(errorObj).toHaveProperty(key);
    }
    spy.mockRestore();
  });

  it.each([
    [
      "both credentials",
      {
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
        LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
      },
    ],
    ["no credentials", {}],
  ])("succeeds with %s", async (_label, extra) => {
    await withEnv(prodEnv(extra), async () => {
      const { authEnv } = await import("../auth");
      expect(authEnv.LOGIN_RATE_LIMIT_REDIS_URL).toBe(
        extra.LOGIN_RATE_LIMIT_REDIS_URL,
      );
      expect(authEnv.LOGIN_RATE_LIMIT_REDIS_TOKEN).toBe(
        extra.LOGIN_RATE_LIMIT_REDIS_TOKEN,
      );
    });
  });
});

describe("AUTH_PROVIDER variants", () => {
  it("defaults to local without secrets", async () => {
    await withEnv(prodEnv({ AUTH_PROVIDER: "local" }), async () => {
      const { authEnv } = await import("../auth");
      expect(authEnv.AUTH_PROVIDER).toBe("local");
    });
  });

  it("requires JWT_SECRET for jwt provider", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  await expectInvalidProd({ AUTH_PROVIDER: "jwt" }, (env) => env.JWT_SECRET, spy);
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    expect(errorObj).toHaveProperty("JWT_SECRET");
    spy.mockRestore();
  });

  it("errors when JWT_SECRET is blank", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  await expectInvalidProd({ AUTH_PROVIDER: "jwt", JWT_SECRET: "" }, (env) => env.JWT_SECRET, spy);
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    expect(errorObj).toHaveProperty("JWT_SECRET");
    spy.mockRestore();
  });

  it("accepts jwt provider with secret", async () => {
    await withEnv(
      prodEnv({ AUTH_PROVIDER: "jwt", JWT_SECRET }),
      async () => {
        const { authEnv } = await import("../auth");
        expect(authEnv.AUTH_PROVIDER).toBe("jwt");
        expect(authEnv.JWT_SECRET).toBe(JWT_SECRET);
      },
    );
  });

  it.each([
    [
      "missing client id",
      { OAUTH_CLIENT_SECRET: OAUTH_CLIENT_SECRET },
      "OAUTH_CLIENT_ID",
    ],
    [
      "missing client secret",
      { OAUTH_CLIENT_ID: OAUTH_CLIENT_ID },
      "OAUTH_CLIENT_SECRET",
    ],
    [
      "blank client id",
      {
        OAUTH_CLIENT_ID: "",
        OAUTH_CLIENT_SECRET: OAUTH_CLIENT_SECRET,
      },
      "OAUTH_CLIENT_ID",
    ],
    [
      "blank client secret",
      {
        OAUTH_CLIENT_ID: OAUTH_CLIENT_ID,
        OAUTH_CLIENT_SECRET: "",
      },
      "OAUTH_CLIENT_SECRET",
    ],
  ])("oauth fails when %s", async (_label, extra, missingKey) => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  await expectInvalidProd({ AUTH_PROVIDER: "oauth", ...extra }, (env) => env.OAUTH_CLIENT_ID, spy);
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    expect(errorObj).toHaveProperty(missingKey);
    spy.mockRestore();
  });

  it("accepts oauth provider with credentials", async () => {
    await withEnv(
      prodEnv({
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: OAUTH_CLIENT_ID,
        OAUTH_CLIENT_SECRET: OAUTH_CLIENT_SECRET,
      }),
      async () => {
        const { authEnv } = await import("../auth");
        expect(authEnv.AUTH_PROVIDER).toBe("oauth");
      },
    );
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  it.each([
    ["numeric", "60", 60],
    ["duration string", "15m", 900],
    ["blank", "", 900],
  ])("parses %s", async (_label, input, expected) => {
    await withEnv(prodEnv({ AUTH_TOKEN_TTL: input }), async () => {
      const { authEnv } = await import("../auth");
      expect(authEnv.AUTH_TOKEN_TTL).toBe(expected);
    });
  });

  it("rejects malformed TTL", async () => {
    await expectInvalidProd({ AUTH_TOKEN_TTL: "abc" }, (env) => env.AUTH_TOKEN_TTL);
  });
});

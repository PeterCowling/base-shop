import { describe, it, expect, jest } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv as expectInvalidAuth } from "../../../test/utils/expectInvalidAuthEnv";
import {
  NEXT_SECRET,
  SESSION_SECRET,
  REDIS_URL,
  REDIS_TOKEN,
  DEV_NEXTAUTH_SECRET,
  DEV_SESSION_SECRET,
  selectStore,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
} from "./authEnvTestUtils";

const redisUnset = {
  SESSION_STORE: undefined,
  UPSTASH_REDIS_REST_URL: undefined,
  UPSTASH_REDIS_REST_TOKEN: undefined,
} satisfies Record<string, string | undefined>;

type EnvOverrides = Record<string, string | undefined>;

const prodEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: "production",
  NEXTAUTH_SECRET: NEXT_SECRET,
  SESSION_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...redisUnset,
  ...overrides,
});

const devEnv = (overrides: EnvOverrides = {}): EnvOverrides => ({
  NODE_ENV: "development",
  NEXTAUTH_SECRET: DEV_NEXTAUTH_SECRET,
  SESSION_SECRET: DEV_SESSION_SECRET,
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...redisUnset,
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

describe("authEnvSchema basics", () => {
  it("accepts minimal valid environment", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
      OAUTH_ISSUER,
      OAUTH_REDIRECT_ORIGIN,
    });
    expect(result.success).toBe(true);
  });
});

describe("authEnvSchema session store", () => {
  const baseEnv = {
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
    OAUTH_ISSUER,
    OAUTH_REDIRECT_ORIGIN,
    ...redisUnset,
  };

  it("requires redis url when SESSION_STORE=redis", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["UPSTASH_REDIS_REST_URL"],
          message:
            "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
        }),
      ]),
    );
  });

  it("requires redis token when SESSION_STORE=redis", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["UPSTASH_REDIS_REST_TOKEN"],
          message:
            "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
        }),
      ]),
    );
  });

  it("accepts redis store when credentials provided", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });
});

describe("auth env session configuration", () => {
  it("throws when SESSION_SECRET is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expectInvalidProd({ SESSION_SECRET: undefined }, (env) => env.SESSION_SECRET, spy);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("loads when SESSION_SECRET is provided", async () => {
    const { authEnv } = await withEnv(prodEnv(), () => import("../auth"));

    expect(authEnv.SESSION_SECRET).toBe(SESSION_SECRET);
  });

  it("selects redis when explicitly configured", async () => {
    const { authEnv } = await withEnv(
      prodEnv({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      }),
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("redis");
  });

  it("prefers memory when explicitly set", async () => {
    const { authEnv } = await withEnv(
      prodEnv({
        SESSION_STORE: "memory",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      }),
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("memory");
  });

  it("falls back to redis when creds present without explicit store", async () => {
    const { authEnv } = await withEnv(
      prodEnv({
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      }),
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("redis");
  });

  it("falls back to memory when no store or creds provided", async () => {
    const { authEnv } = await withEnv(prodEnv(), () => import("../auth"));

    expect(selectStore(authEnv)).toBe("memory");
  });
});

describe("SESSION_STORE=redis", () => {
  const base = prodEnv();

  describe.each([
    [
      "missing UPSTASH_REDIS_REST_URL",
      { UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN },
      (env: Record<string, unknown>) => env.UPSTASH_REDIS_REST_URL,
    ],
    [
      "missing UPSTASH_REDIS_REST_TOKEN",
      { UPSTASH_REDIS_REST_URL: REDIS_URL },
      (env: Record<string, unknown>) => env.UPSTASH_REDIS_REST_TOKEN,
    ],
  ])("throws when %s", (_, extra, accessor) => {
    it("throws", async () => {
      await expectInvalidProd({ SESSION_STORE: "redis", ...extra }, accessor);
    });
  });

  it("loads when redis credentials are provided", async () => {
    const { authEnv } = await withEnv(
      {
        ...base,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("../auth"),
    );
    expect(selectStore(authEnv)).toBe("redis");
  });
});

describe("development defaults", () => {
  it("applies dev secrets when NODE_ENV is not production", async () => {
    const { authEnv } = await withEnv(
      devEnv({ NEXTAUTH_SECRET: undefined, SESSION_SECRET: undefined }),
      () => import("../auth"),
    );
    expect(authEnv.NEXTAUTH_SECRET).toBe(DEV_NEXTAUTH_SECRET);
    expect(authEnv.SESSION_SECRET).toBe(DEV_SESSION_SECRET);
  });
});

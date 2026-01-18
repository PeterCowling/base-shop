/** @jest-environment node */
import { describe, it, expect, jest } from "@jest/globals";
import { withEnv } from "../../config/test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv } from "../../config/test/utils/expectInvalidAuthEnv";

const REDIS_URL = "https://example.com";
const STRONG_SECRET = "redis-token-32-chars-long-string!";

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

  it("requires strong JWT secrets", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidDev(
        { AUTH_PROVIDER: "jwt", JWT_SECRET: "weak" },
        (env) => env.JWT_SECRET,
        spy,
      );
      const formatted = spy.mock.calls[0][1];
      expect(formatted.JWT_SECRET?._errors[0]).toContain(
        "must be at least 32 characters",
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("requires upstash credentials for redis session store", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await expectInvalidDev(
        {
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: REDIS_URL,
        },
        (env) => env.UPSTASH_REDIS_REST_TOKEN,
        spy,
      );
      const formatted = spy.mock.calls[0][1];
      expect(formatted.UPSTASH_REDIS_REST_TOKEN?._errors[0]).toContain(
        "UPSTASH_REDIS_REST_TOKEN is required",
      );
    } finally {
      spy.mockRestore();
    }
  });

  it("loads when redis credentials provided", async () => {
    const { authEnv } = await withEnv(
      devEnv({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: STRONG_SECRET,
      }),
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.SESSION_STORE).toBe("redis");
  });
});

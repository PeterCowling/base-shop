import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";
import { expectInvalidAuthEnvWithConfigEnv } from "../../../config/test/utils/expectInvalidAuthEnv";
import { selectStore } from "../../../config/src/env/__tests__/authEnvTestUtils";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const REDIS_URL = "https://example.com";
const REDIS_TOKEN = "redis-token-32-chars-long-string!";
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

const expectInvalidProd = (
  overrides: EnvOverrides,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: jest.SpiedFunction<typeof console.error>,
) =>
  expectInvalidAuthEnvWithConfigEnv({
    env: prodEnv(overrides),
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

const getProdAuthEnv = async (overrides: EnvOverrides = {}) => {
  const { authEnv } = await withEnv(prodEnv(overrides), () => import("@acme/config/env/auth"));
  return authEnv;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("auth env session configuration", () => {
  it("throws when SESSION_SECRET is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidProd({ SESSION_SECRET: undefined }, (env) => env.SESSION_SECRET, spy);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("selects redis when explicitly configured", async () => {
    const authEnv = await getProdAuthEnv({
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(selectStore(authEnv)).toBe("redis");
  });

  it("prefers memory when explicitly set", async () => {
    const authEnv = await getProdAuthEnv({
      SESSION_STORE: "memory",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(selectStore(authEnv)).toBe("memory");
  });

  it("falls back to redis when creds present without explicit store", async () => {
    const authEnv = await getProdAuthEnv({
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(selectStore(authEnv)).toBe("redis");
  });

  it("falls back to memory when no store or creds provided", async () => {
    const authEnv = await getProdAuthEnv();
    expect(selectStore(authEnv)).toBe("memory");
  });
});

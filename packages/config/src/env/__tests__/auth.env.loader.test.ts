import { describe, it, expect, jest } from "@jest/globals";
import { createExpectInvalidAuthEnv } from "../../../test/utils/expectInvalidAuthEnv";
import {
  DEV_NEXTAUTH_SECRET,
  DEV_SESSION_SECRET,
  REDIS_URL,
  REDIS_TOKEN,
} from "./authEnvTestUtils";

const JWT_SECRET = "jwt-secret-32-chars-long-string!!!";
const OAUTH_CLIENT_ID = "client-id";
const OAUTH_CLIENT_SECRET =
  "oauth-client-secret-32-chars-long-string!!";
const OAUTH_ISSUER = "https://auth.example.com/realms/base-shop";
const OAUTH_REDIRECT_ORIGIN = "https://shop.example.com";

const reload = async () => {
  jest.resetModules();
  return await import("../auth.ts");
};

// Ensure tests run with a predictable environment even if the host process
// predefines secrets (for example via jest.setup.ts or CI configuration).
const CONTROLLED_ENV_KEYS = [
  'NEXTAUTH_SECRET',
  'SESSION_SECRET',
  'PREVIEW_TOKEN_SECRET',
  'UPGRADE_PREVIEW_TOKEN_SECRET',
  'JWT_SECRET',
  'SESSION_STORE',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'LOGIN_RATE_LIMIT_REDIS_URL',
  'LOGIN_RATE_LIMIT_REDIS_TOKEN',
  'OAUTH_ISSUER',
  'OAUTH_CLIENT_ID',
  'OAUTH_CLIENT_SECRET',
  'OAUTH_REDIRECT_ORIGIN',
];

const withEnv = async (
  env: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
) => {
  const prev = { ...process.env };
  const sanitized = { ...prev } as Record<string, string | undefined>;
  for (const key of CONTROLLED_ENV_KEYS) {
    if (!(key in env)) {
      delete sanitized[key];
    }
  }
  process.env = sanitized as NodeJS.ProcessEnv;
  Object.entries(env).forEach(([k, v]) => {
    if (v === undefined) delete (process.env as any)[k];
    else (process.env as any)[k] = v;
  });
  try {
    await fn();
  } finally {
    process.env = prev;
  }
};

const expectInvalidAuth = createExpectInvalidAuthEnv(withEnv);

describe('config/env/auth', () => {
  it('coerces boolean and ttl', async () =>
    withEnv(
      {
        AUTH_PROVIDER: 'local',
        ALLOW_GUEST: '1',
        AUTH_TOKEN_TTL: '2m',
      },
      async () => {
        const { loadAuthEnv } = await reload();
        const env = loadAuthEnv();
        expect(env.ALLOW_GUEST).toBe(true);
        expect(env.AUTH_TOKEN_TTL).toBe(120);
      },
    ));

  it('throws on unknown provider', async () =>
    expectInvalidAuth({
      env: { AUTH_PROVIDER: "unknown" },
      accessor: (auth) => auth.authEnv.AUTH_PROVIDER,
    }));

  it('allows dev defaults during Next production build phase', async () =>
    withEnv(
      {
        NODE_ENV: 'production',
        NEXT_PHASE: 'phase-production-build',
      },
      async () => {
        const { loadAuthEnv } = await reload();
        const env = loadAuthEnv();
        expect(env.NEXTAUTH_SECRET).toBe(DEV_NEXTAUTH_SECRET);
        expect(env.SESSION_SECRET).toBe(DEV_SESSION_SECRET);
      },
    ));

  it('requires JWT_SECRET for jwt provider', async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expectInvalidAuth({
      env: { NODE_ENV: "development", AUTH_PROVIDER: "jwt" },
      accessor: (auth) => auth.authEnv.JWT_SECRET,
      consoleErrorSpy: spy,
    });
    const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
    expect(errorObj).toHaveProperty("JWT_SECRET");
    spy.mockRestore();
  });

  it.each([
    ['60', 60],
    ['60 ', 60],
    ['60 s', 60],
    ['5m', 300],
    [' 5m ', 300],
  ])(
    'normalizes AUTH_TOKEN_TTL %p to %d outside test env',
    async (raw, expected) =>
      withEnv({ NODE_ENV: 'development', AUTH_TOKEN_TTL: raw }, async () => {
        const { loadAuthEnv } = await reload();
        const env = loadAuthEnv();
        expect(env.AUTH_TOKEN_TTL).toBe(expected);
      }),
  );

  it('defaults AUTH_TOKEN_TTL when blank outside test env', async () =>
    withEnv(
      { NODE_ENV: 'development', AUTH_TOKEN_TTL: '' },
      async () => {
        const { loadAuthEnv } = await reload();
        const env = loadAuthEnv();
        expect(env.AUTH_TOKEN_TTL).toBe(900);
      },
    ));

  describe('SESSION_STORE redis requirements', () => {
    it.each([
      [
        'missing UPSTASH_REDIS_REST_URL',
        { UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN },
        'UPSTASH_REDIS_REST_URL',
      ],
      [
        'missing UPSTASH_REDIS_REST_TOKEN',
        { UPSTASH_REDIS_REST_URL: REDIS_URL },
        'UPSTASH_REDIS_REST_TOKEN',
      ],
    ])('fails when %s', async (_label, extra, missing) => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: { NODE_ENV: "development", SESSION_STORE: "redis", ...extra },
        accessor: (auth) =>
          (auth.authEnv as Record<string, unknown>)[missing],
        consoleErrorSpy: spy,
      });
      const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(errorObj).toHaveProperty(missing);
      spy.mockRestore();
    });

    it('fails when both redis credentials missing', async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: { NODE_ENV: "development", SESSION_STORE: "redis" },
        accessor: (auth) => (auth.authEnv as Record<string, unknown>)[
          "UPSTASH_REDIS_REST_URL"
        ],
        consoleErrorSpy: spy,
      });
      const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(errorObj).toHaveProperty("UPSTASH_REDIS_REST_URL");
      expect(errorObj).toHaveProperty("UPSTASH_REDIS_REST_TOKEN");
      spy.mockRestore();
    });
  });

  describe('login rate limit redis credentials', () => {
    it.each([
      [
        'URL only',
        { LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL },
        'LOGIN_RATE_LIMIT_REDIS_TOKEN',
      ],
      [
        'token only',
        { LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN },
        'LOGIN_RATE_LIMIT_REDIS_URL',
      ],
    ])('errors with %s', async (_label, extra, missing) => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: { NODE_ENV: "development", ...extra },
        accessor: (auth) =>
          (auth.authEnv as Record<string, unknown>)[missing],
        consoleErrorSpy: spy,
      });
      const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(errorObj).toHaveProperty(missing);
      spy.mockRestore();
    });
  });

  describe('oauth provider credentials', () => {
    it.each([
      [
        'missing client id',
        { OAUTH_CLIENT_SECRET: OAUTH_CLIENT_SECRET },
        'OAUTH_CLIENT_ID',
      ],
      [
        'missing client secret',
        { OAUTH_CLIENT_ID: OAUTH_CLIENT_ID },
        'OAUTH_CLIENT_SECRET',
      ],
    ])('fails when %s', async (_label, extra, missing) => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expectInvalidAuth({
        env: {
          NODE_ENV: "development",
          AUTH_PROVIDER: "oauth",
          OAUTH_ISSUER,
          OAUTH_REDIRECT_ORIGIN,
          ...extra,
        },
        accessor: (auth) =>
          (auth.authEnv as Record<string, unknown>)[missing],
        consoleErrorSpy: spy,
      });
      const errorObj = spy.mock.calls[0][1] as Record<string, unknown>;
      expect(errorObj).toHaveProperty(missing);
      spy.mockRestore();
    });
  });
});

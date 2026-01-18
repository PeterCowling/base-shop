import { describe, it, expect, afterEach } from '@jest/globals';
import { createExpectInvalidAuthEnv } from '../../../config/test/utils/expectInvalidAuthEnv';
import { withEnv } from './envTestUtils';

const REDIS_URL = 'https://example.com';
const STRONG_TOKEN = 'redis-token-32-chars-long-string!';
const OAUTH_ISSUER = 'https://auth.example.com/realms/base-shop';
const OAUTH_REDIRECT_ORIGIN = 'https://shop.example.com';
const expectInvalidAuthEnv = createExpectInvalidAuthEnv(withEnv);

const devEnv = (
  overrides: Record<string, string | undefined>,
): Record<string, string | undefined> => ({
  NODE_ENV: 'development',
  OAUTH_ISSUER,
  OAUTH_REDIRECT_ORIGIN,
  ...overrides,
});

const expectInvalidDev = (
  overrides: Record<string, string | undefined>,
  accessor: (env: Record<string, unknown>) => unknown,
  consoleErrorSpy?: jest.SpiedFunction<typeof console.error>,
) =>
  expectInvalidAuthEnv({
    env: devEnv(overrides),
    accessor: (auth) => accessor(auth.authEnv as Record<string, unknown>),
    consoleErrorSpy,
  });

describe('auth env validation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('normalises AUTH_TOKEN_TTL values', async () => {
    const result = await withEnv(
      { NODE_ENV: 'development', AUTH_TOKEN_TTL: ' 5 m ' },
      async () => {
        const mod = await import("@acme/config/env/auth");
        return { ...mod, ttl: process.env.AUTH_TOKEN_TTL };
      },
    );
    expect(result.ttl).toBe('5m');
    expect(result.authEnv.AUTH_TOKEN_TTL).toBe(300);
  });

  it('requires both redis credentials when SESSION_STORE=redis (missing token)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expectInvalidDev(
      {
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_URL: REDIS_URL,
      },
      (env) => env.UPSTASH_REDIS_REST_TOKEN,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.UPSTASH_REDIS_REST_TOKEN?._errors[0]).toContain('UPSTASH_REDIS_REST_TOKEN is required');
    errorSpy.mockRestore();
  });

  it('requires both redis credentials when SESSION_STORE=redis (missing url)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expectInvalidDev(
      {
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      },
      (env) => env.UPSTASH_REDIS_REST_URL,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.UPSTASH_REDIS_REST_URL?._errors[0]).toContain('UPSTASH_REDIS_REST_URL is required');
    errorSpy.mockRestore();
  });

  it('accepts redis store when credentials provided', async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: 'development',
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      },
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.SESSION_STORE).toBe('redis');
  });

  it('requires both login rate limit redis credentials (missing token)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expectInvalidDev(
      {
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
      },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.LOGIN_RATE_LIMIT_REDIS_TOKEN?._errors[0]).toContain('LOGIN_RATE_LIMIT_REDIS_TOKEN is required');
    errorSpy.mockRestore();
  });

  it('requires both login rate limit redis credentials (missing url)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expectInvalidDev(
      {
        LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
      },
      (env) => env.LOGIN_RATE_LIMIT_REDIS_URL,
      errorSpy,
    );
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.LOGIN_RATE_LIMIT_REDIS_URL?._errors[0]).toContain('LOGIN_RATE_LIMIT_REDIS_URL is required');
    errorSpy.mockRestore();
  });

  it('throws for jwt provider without secret', async () => {
    await expectInvalidDev(
      { AUTH_PROVIDER: 'jwt' },
      (env) => env.JWT_SECRET,
    );
  });

  it('loads for jwt provider with secret', async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: 'development',
        AUTH_PROVIDER: 'jwt',
        JWT_SECRET: STRONG_TOKEN,
      },
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.JWT_SECRET).toBe(STRONG_TOKEN);
  });

  it('throws for oauth provider missing client id', async () => {
    await expectInvalidDev(
      {
        AUTH_PROVIDER: 'oauth',
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
      },
      (env) => env.OAUTH_CLIENT_ID,
    );
  });

  it('throws for oauth provider missing client secret', async () => {
    await expectInvalidDev(
      {
        AUTH_PROVIDER: 'oauth',
        OAUTH_CLIENT_ID: 'client-id',
      },
      (env) => env.OAUTH_CLIENT_SECRET,
    );
  });

  it('loads when oauth provider has credentials', async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: 'development',
        AUTH_PROVIDER: 'oauth',
        OAUTH_CLIENT_ID: 'client-id',
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
      },
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.AUTH_PROVIDER).toBe('oauth');
    expect(authEnv.OAUTH_CLIENT_ID).toBe('client-id');
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('parses ALLOW_GUEST=%s', async (value, expected) => {
    const { authEnv } = await withEnv(
      { NODE_ENV: 'development', ALLOW_GUEST: value },
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.ALLOW_GUEST).toBe(expected);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('parses ENFORCE_2FA=%s', async (value, expected) => {
    const { authEnv } = await withEnv(
      { NODE_ENV: 'development', ENFORCE_2FA: value },
      () => import("@acme/config/env/auth"),
    );
    expect(authEnv.ENFORCE_2FA).toBe(expected);
  });

  it('throws for invalid ALLOW_GUEST string', async () => {
    await expectInvalidAuthEnv({
      env: devEnv({}),
      accessor: (auth) =>
        auth.loadAuthEnv({
          NODE_ENV: 'development',
          ALLOW_GUEST: 'maybe',
        } as any),
    });
  });

  it('throws for invalid ENFORCE_2FA string', async () => {
    await expectInvalidAuthEnv({
      env: devEnv({}),
      accessor: (auth) =>
        auth.loadAuthEnv({
          NODE_ENV: 'development',
          ENFORCE_2FA: 'maybe',
        } as any),
    });
  });
});

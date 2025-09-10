import { describe, it, expect, afterEach } from '@jest/globals';
import { withEnv } from './envTestUtils';

const REDIS_URL = 'https://example.com';
const STRONG_TOKEN = 'redis-token-32-chars-long-string!';

describe('auth env validation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejects invalid AUTH_TOKEN_TTL values', async () => {
    await expect(
      withEnv(
        { NODE_ENV: 'development', AUTH_TOKEN_TTL: ' 5 m ' },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
  });

  it('requires both redis credentials when SESSION_STORE=redis (missing token)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: 'development',
          SESSION_STORE: 'redis',
          UPSTASH_REDIS_REST_URL: REDIS_URL,
        },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.UPSTASH_REDIS_REST_TOKEN?._errors[0]).toContain('UPSTASH_REDIS_REST_TOKEN is required');
  });

  it('requires both redis credentials when SESSION_STORE=redis (missing url)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: 'development',
          SESSION_STORE: 'redis',
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.UPSTASH_REDIS_REST_URL?._errors[0]).toContain('UPSTASH_REDIS_REST_URL is required');
  });

  it('accepts redis store when credentials provided', async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: 'development',
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
      },
      () => import('@acme/config/src/env/auth.ts'),
    );
    expect(authEnv.SESSION_STORE).toBe('redis');
  });

  it('requires both login rate limit redis credentials (missing token)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: 'development',
          LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
        },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.LOGIN_RATE_LIMIT_REDIS_TOKEN?._errors[0]).toContain('LOGIN_RATE_LIMIT_REDIS_TOKEN is required');
  });

  it('requires both login rate limit redis credentials (missing url)', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: 'development',
          LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
        },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.LOGIN_RATE_LIMIT_REDIS_URL?._errors[0]).toContain('LOGIN_RATE_LIMIT_REDIS_URL is required');
  });

  it('throws for jwt provider without secret', async () => {
    await expect(
      withEnv(
        { NODE_ENV: 'development', AUTH_PROVIDER: 'jwt' },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
  });

  it('loads for jwt provider with secret', async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: 'development',
        AUTH_PROVIDER: 'jwt',
        JWT_SECRET: STRONG_TOKEN,
      },
      () => import('@acme/config/src/env/auth.ts'),
    );
    expect(authEnv.JWT_SECRET).toBe(STRONG_TOKEN);
  });

  it('throws for oauth provider missing client id', async () => {
    await expect(
      withEnv(
        {
          NODE_ENV: 'development',
          AUTH_PROVIDER: 'oauth',
          OAUTH_CLIENT_SECRET: STRONG_TOKEN,
        },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
  });

  it('throws for oauth provider missing client secret', async () => {
    await expect(
      withEnv(
        {
          NODE_ENV: 'development',
          AUTH_PROVIDER: 'oauth',
          OAUTH_CLIENT_ID: 'client-id',
        },
        () => import('@acme/config/src/env/auth.ts'),
      ),
    ).rejects.toThrow('Invalid auth environment variables');
  });

  it('loads when oauth provider has credentials', async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: 'development',
        AUTH_PROVIDER: 'oauth',
        OAUTH_CLIENT_ID: 'client-id',
        OAUTH_CLIENT_SECRET: STRONG_TOKEN,
      },
      () => import('@acme/config/src/env/auth.ts'),
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
      () => import('@acme/config/src/env/auth.ts'),
    );
    expect(authEnv.ALLOW_GUEST).toBe(expected);
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('parses ENFORCE_2FA=%s', async (value, expected) => {
    const { authEnv } = await withEnv(
      { NODE_ENV: 'development', ENFORCE_2FA: value },
      () => import('@acme/config/src/env/auth.ts'),
    );
    expect(authEnv.ENFORCE_2FA).toBe(expected);
  });

  it('throws for invalid ALLOW_GUEST string', async () => {
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { loadAuthEnv } = await import(
      '@acme/config/src/env/auth.ts'
    );
    expect(() =>
      loadAuthEnv({
        NODE_ENV: 'development',
        ALLOW_GUEST: 'maybe',
      } as any),
    ).toThrow('Invalid auth environment variables');
    errorSpy.mockRestore();
  });

  it('throws for invalid ENFORCE_2FA string', async () => {
    const errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { loadAuthEnv } = await import(
      '@acme/config/src/env/auth.ts'
    );
    expect(() =>
      loadAuthEnv({
        NODE_ENV: 'development',
        ENFORCE_2FA: 'maybe',
      } as any),
    ).toThrow('Invalid auth environment variables');
    errorSpy.mockRestore();
  });
});


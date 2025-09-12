import { describe, it, expect } from '@jest/globals';
import { REDIS_URL, REDIS_TOKEN } from './authEnvTestUtils';

const reload = async () => {
  jest.resetModules();
  return await import('../auth.ts');
};

const withEnv = async (
  env: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
) => {
  const prev = { ...process.env };
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
    withEnv({ AUTH_PROVIDER: 'unknown' }, async () => {
      await expect(reload()).rejects.toThrow(
        'Invalid auth environment variables',
      );
    }));

  it('requires JWT_SECRET for jwt provider', async () =>
    withEnv({ AUTH_PROVIDER: 'jwt' }, async () => {
      await expect(reload()).rejects.toThrow(
        'Invalid auth environment variables',
      );
    }));

  it.each([
    ['60 ', 60],
    [' 5m ', 300],
    ['60 s', 60],
  ])(
    'normalizes AUTH_TOKEN_TTL %p to %d outside test env',
    async (raw, expected) =>
      withEnv({ NODE_ENV: 'development', AUTH_TOKEN_TTL: raw }, async () => {
        const { loadAuthEnv } = await reload();
        const env = loadAuthEnv();
        expect(env.AUTH_TOKEN_TTL).toBe(expected);
      }),
  );

  it('requires UPSTASH_REDIS_REST_URL when SESSION_STORE=redis', async () =>
    withEnv(
      {
        NODE_ENV: 'development',
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      async () => {
        await expect(reload()).rejects.toThrow(
          'Invalid auth environment variables',
        );
      },
    ));

  it('requires UPSTASH_REDIS_REST_TOKEN when SESSION_STORE=redis', async () =>
    withEnv(
      {
        NODE_ENV: 'development',
        SESSION_STORE: 'redis',
        UPSTASH_REDIS_REST_URL: REDIS_URL,
      },
      async () => {
        await expect(reload()).rejects.toThrow(
          'Invalid auth environment variables',
        );
      },
    ));

  it('requires redis credentials when SESSION_STORE=redis', async () =>
    withEnv(
      { NODE_ENV: 'development', SESSION_STORE: 'redis' },
      async () => {
        await expect(reload()).rejects.toThrow(
          'Invalid auth environment variables',
        );
      },
    ));

  it(
    'requires LOGIN_RATE_LIMIT_REDIS_TOKEN when LOGIN_RATE_LIMIT_REDIS_URL is set',
    async () =>
      withEnv(
        { NODE_ENV: 'development', LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL },
        async () => {
          await expect(reload()).rejects.toThrow(
            'Invalid auth environment variables',
          );
        },
      ),
  );

  it(
    'requires LOGIN_RATE_LIMIT_REDIS_URL when LOGIN_RATE_LIMIT_REDIS_TOKEN is set',
    async () =>
      withEnv(
        { NODE_ENV: 'development', LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN },
        async () => {
          await expect(reload()).rejects.toThrow(
            'Invalid auth environment variables',
          );
        },
      ),
  );

  it('requires OAuth credentials for oauth provider', async () =>
    withEnv(
      { NODE_ENV: 'development', AUTH_PROVIDER: 'oauth' },
      async () => {
        await expect(reload()).rejects.toThrow(
          'Invalid auth environment variables',
        );
      },
    ));
});


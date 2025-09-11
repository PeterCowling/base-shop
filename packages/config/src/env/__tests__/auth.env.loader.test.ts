import { describe, it, expect } from '@jest/globals';

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
});


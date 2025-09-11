import { describe, it, expect } from '@jest/globals';

const reload = async () => {
  jest.resetModules();
  return await import('../shipping.ts');
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

describe('config/env/shipping', () => {
  it('parses lists, booleans, and numbers', async () =>
    withEnv(
      {
        ALLOWED_COUNTRIES: 'us, ca ,de',
        LOCAL_PICKUP_ENABLED: 'yes',
        FREE_SHIPPING_THRESHOLD: '25',
      },
      async () => {
        const { loadShippingEnv } = await reload();
        const env = loadShippingEnv();
        expect(env.ALLOWED_COUNTRIES).toEqual(['US', 'CA', 'DE']);
        expect(env.LOCAL_PICKUP_ENABLED).toBe(true);
        expect(env.FREE_SHIPPING_THRESHOLD).toBe(25);
      },
    ));

  it('throws on unknown provider', async () =>
    withEnv({ SHIPPING_PROVIDER: 'fedex' as any }, async () => {
      await expect(reload()).rejects.toThrow(
        'Invalid shipping environment variables',
      );
    }));

  it('requires carrier keys', async () => {
    await withEnv({ SHIPPING_PROVIDER: 'ups' }, async () => {
      await expect(reload()).rejects.toThrow(
        'Invalid shipping environment variables',
      );
    });
    await withEnv({ SHIPPING_PROVIDER: 'dhl' }, async () => {
      await expect(reload()).rejects.toThrow(
        'Invalid shipping environment variables',
      );
    });
  });
});


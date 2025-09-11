import { describe, it, expect } from '@jest/globals';

const reload = async () => {
  jest.resetModules();
  return await import('../payments.ts');
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

describe('config/env/payments', () => {
  it('parses sandbox flag for stripe', async () =>
    withEnv(
      {
        PAYMENTS_PROVIDER: 'stripe',
        STRIPE_SECRET_KEY: 'sk',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk',
        STRIPE_WEBHOOK_SECRET: 'whsec',
        PAYMENTS_SANDBOX: 'false',
      },
      async () => {
        const { loadPaymentsEnv } = await reload();
        const env = loadPaymentsEnv();
        expect(env.PAYMENTS_PROVIDER).toBe('stripe');
        expect(env.PAYMENTS_SANDBOX).toBe(false);
      },
    ));

  it('throws on unknown provider', async () =>
    withEnv({ PAYMENTS_PROVIDER: 'paypal' }, async () => {
      await expect(reload()).rejects.toThrow(
        'Invalid payments environment variables',
      );
    }));

  it('requires stripe keys', async () =>
    withEnv(
      {
        PAYMENTS_PROVIDER: 'stripe',
        STRIPE_SECRET_KEY: 'sk',
      },
      async () => {
        await expect(reload()).rejects.toThrow(
          'Invalid payments environment variables',
        );
      },
    ));
});


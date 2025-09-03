/** @jest-environment node */
// packages/stripe/src/__tests__/payments-env-invalid.test.ts

describe('payments env invalid', () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it('falls back to defaults and warns when env vars are invalid', async () => {
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: '',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '',
      STRIPE_WEBHOOK_SECRET: '',
    } as NodeJS.ProcessEnv;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    jest.resetModules();
    const { paymentsEnv } = await import('@acme/config/env/payments');

    expect(paymentsEnv).toEqual({
      STRIPE_SECRET_KEY: 'sk_test',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test',
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
    });
    expect(warnSpy).toHaveBeenCalled();
  });
});

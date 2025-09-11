/** @jest-environment node */

import { describe, it, expect, afterEach, jest } from '@jest/globals';

describe('stripe wrapper', () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it('throws without STRIPE_SECRET_KEY', async () => {
    jest.doMock('@acme/config/env/core', () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));

    await expect(import('../src/index.ts')).rejects.toThrow(/apiKey/i);
  });

  it('throws with invalid STRIPE_SECRET_KEY format', async () => {
    const StripeCtor = jest.fn().mockImplementation(() => ({}));
    StripeCtor.createFetchHttpClient = jest.fn().mockReturnValue({});
    StripeCtor.mockImplementation(() => {
      throw new Error('Invalid API Key provided: invalid');
    });

    jest.doMock('stripe', () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock('@acme/config/env/core', () => ({
      coreEnv: { STRIPE_SECRET_KEY: 'invalid' },
    }));

    await expect(import('../src/index.ts')).rejects.toThrow(/invalid api key/i);
  });

  it('creates client and allows calling methods', async () => {
    const create = jest.fn();
    const StripeCtor = jest.fn().mockImplementation(() => ({
      charges: { create },
    }));
    StripeCtor.createFetchHttpClient = jest.fn().mockReturnValue({});

    jest.doMock('stripe', () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock('@acme/config/env/core', () => ({
      coreEnv: { STRIPE_SECRET_KEY: 'sk_test_123' },
    }));

    const { stripe } = await import('../src/index.ts');
    await stripe.charges.create({ amount: 100 });

    expect(StripeCtor).toHaveBeenCalledWith('sk_test_123', expect.any(Object));
    expect(create).toHaveBeenCalledWith({ amount: 100 });
  });

  it('reuses existing client instance on subsequent imports', async () => {
    const StripeCtor = jest.fn().mockImplementation(() => ({}));
    StripeCtor.createFetchHttpClient = jest.fn().mockReturnValue({});

    jest.doMock('stripe', () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock('@acme/config/env/core', () => ({
      coreEnv: { STRIPE_SECRET_KEY: 'sk_test_123' },
    }));

    const mod1 = await import('../src/index.ts');
    const mod2 = await import('../src/index.ts');

    expect(mod1.stripe).toBe(mod2.stripe);
    expect(StripeCtor).toHaveBeenCalledTimes(1);
  });
});


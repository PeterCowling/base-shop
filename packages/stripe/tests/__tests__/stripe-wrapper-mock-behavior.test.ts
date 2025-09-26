/** @jest-environment node */

import { describe, it, expect, afterEach, jest } from '@jest/globals';

describe('stripe wrapper (mock behavior)', () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it('exposes and executes mock methods when STRIPE_USE_MOCK=true', async () => {
    process.env = { ...OLD_ENV, STRIPE_USE_MOCK: 'true' } as NodeJS.ProcessEnv;

    const StripeCtor = jest.fn();
    jest.doMock('stripe', () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock('@acme/config/env/core', () => ({ coreEnv: { STRIPE_SECRET_KEY: undefined } }));

    const { stripe } = await import('../../src/index.ts');

    // checkout.sessions.retrieve
    const session = await stripe.checkout.sessions.retrieve('cs_123');
    expect(session.id).toBe('cs_123');

    // refunds.create
    const refund = await stripe.refunds.create({ reason: 'requested_by_customer' } as any);
    expect(refund.id).toBe('re_mock');

    // paymentIntents.create
    const pi = await stripe.paymentIntents.create({ amount: 1500 } as any);
    expect(pi.id).toBe('pi_mock');
    expect((pi as any).client_secret).toBe('cs_mock');

    // subscriptions.del
    const sub = await stripe.subscriptions.del('sub_123');
    expect(sub.id).toBe('sub_123');
    expect((sub as any).status).toBe('canceled');

    // Real Stripe ctor is never called in mock mode
    expect(StripeCtor).not.toHaveBeenCalled();
  });
});


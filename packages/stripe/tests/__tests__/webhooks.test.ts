/** @jest-environment node */

import Stripe from 'stripe';

import eventFixture from '../../test/fixtures/payment_intent.succeeded.json';

describe('stripe webhooks', () => {
  it('constructs event matching fixture', () => {
    const stripe = new Stripe('sk_test', { apiVersion: '2025-06-30.basil' });

    const payload = JSON.stringify(eventFixture);
    const secret = 'whsec_test';
    const cryptoProvider = Stripe.createNodeCryptoProvider();

    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
      cryptoProvider,
    });
    const event = stripe.webhooks.constructEvent(
      payload,
      header,
      secret,
      undefined,
      cryptoProvider,
    );

    expect(event.id).toBe(eventFixture.id);
    expect(event.type).toBe(eventFixture.type);
    expect(event.api_version).toBe(eventFixture.api_version);
    const obj = event.data.object as Stripe.PaymentIntent;
    expect(obj.id).toBe(eventFixture.data.object.id);
    expect(obj.object).toBe(eventFixture.data.object.object);
    expect(obj.status).toBe(eventFixture.data.object.status);
    expect(obj.amount).toBe(eventFixture.data.object.amount);
    expect(obj.currency).toBe(eventFixture.data.object.currency);
  });
});

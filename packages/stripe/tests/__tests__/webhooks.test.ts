/** @jest-environment node */

import Stripe from 'stripe';
import eventFixture from '../../test/fixtures/payment_intent.succeeded.json';

describe('stripe webhooks', () => {
  it('constructs event matching fixture', () => {
    const stripe = new Stripe('sk_test', { apiVersion: '2023-10-16' });

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
    expect(event.data.object.id).toBe(eventFixture.data.object.id);
    expect(event.data.object.object).toBe(eventFixture.data.object.object);
    expect(event.data.object.status).toBe(eventFixture.data.object.status);
    expect(event.data.object.amount).toBe(eventFixture.data.object.amount);
    expect(event.data.object.currency).toBe(eventFixture.data.object.currency);
  });
});

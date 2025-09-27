// packages/stripe/src/index.ts
import "server-only";

import { coreEnv } from "@acme/config/env/core";
import Stripe from "stripe";

/**
 * Edge-friendly Stripe client with safe fallbacks for tests/dev.
 *
 * • Uses `createFetchHttpClient` so it works on Cloudflare Workers / Pages.
 * • Pins `apiVersion` to Stripe’s latest GA (“2025-06-30.basil”) so typings
 *   and requests stay in sync.
 * • When `STRIPE_USE_MOCK` is true, exports a lightweight mock that logs
 *   calls and returns predictable dummy data. Otherwise a real client is
 *   created and a missing secret throws immediately.
 */

function createMock(): Stripe {
  const mockStripe = {
    checkout: {
      sessions: {
        async create(params: unknown) {
          console.info("[stripe-mock] checkout.sessions.create", params); // i18n-exempt: developer debug log label
          return {
            id: "cs_test_mock",
            url: "https://example.com/mock-session",
            object: "checkout.session",
          } as const;
        },
        async retrieve(id: string, params?: unknown) {
          console.info("[stripe-mock] checkout.sessions.retrieve", id, params); // i18n-exempt: developer debug log label
          return {
            id,
            object: "checkout.session",
            metadata: {},
          } as unknown as Stripe.Checkout.Session;
        },
      },
    },
    refunds: {
      async create(params: unknown) {
        console.info("[stripe-mock] refunds.create", params); // i18n-exempt: developer debug log label
        return { id: "re_mock", object: "refund", ...(params as object) } as unknown as Stripe.Refund;
      },
    },
    paymentIntents: {
      async update(id: string, params: unknown) {
        console.info("[stripe-mock] paymentIntents.update", id, params); // i18n-exempt: developer debug log label
        return { id, object: "payment_intent", ...(params as object) } as unknown as Stripe.PaymentIntent;
      },
      async create(params: unknown) {
        console.info("[stripe-mock] paymentIntents.create", params); // i18n-exempt: developer debug log label
        return { id: "pi_mock", object: "payment_intent", client_secret: "cs_mock", ...(params as object) } as unknown as Stripe.PaymentIntent;
      },
    },
    subscriptions: {
      async del(id: string) {
        console.info("[stripe-mock] subscriptions.del", id); // i18n-exempt: developer debug log label
        return { id, status: "canceled" } as unknown as Stripe.Subscription;
      },
    },
  };
  return mockStripe as unknown as Stripe;
}

const useMock = process.env.STRIPE_USE_MOCK === "true";
const secret = coreEnv.STRIPE_SECRET_KEY;

let stripeClient: Stripe;
if (useMock) {
  // Explicit opt-in mock for local dev/tests.
  stripeClient = createMock();
} else {
  // In all non-mock modes, require a real secret key.
  if (!secret) {
    throw new Error("Neither apiKey nor config.authenticator provided"); // i18n-exempt: developer-facing configuration error, not user-visible
  }
  stripeClient = new Stripe(secret, {
    apiVersion: "2025-06-30.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const stripe = stripeClient;

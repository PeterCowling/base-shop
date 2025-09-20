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
 * • When `STRIPE_USE_MOCK` is true, or when no secret is configured outside
 *   production, exports a lightweight mock that logs calls and returns
 *   predictable dummy data.
 */

function createMock(): Stripe {
  const mockStripe = {
    checkout: {
      sessions: {
        async create(params: unknown) {
          console.info("[stripe-mock] checkout.sessions.create", params);
          return {
            id: "cs_test_mock",
            url: "https://example.com/mock-session",
            object: "checkout.session",
          } as const;
        },
        async retrieve(id: string, params?: unknown) {
          console.info("[stripe-mock] checkout.sessions.retrieve", id, params);
          return {
            id,
            object: "checkout.session",
            metadata: {},
          } as any;
        },
      },
    },
    refunds: {
      async create(params: unknown) {
        console.info("[stripe-mock] refunds.create", params);
        return { id: "re_mock", object: "refund", ...(params as object) } as any;
      },
    },
    paymentIntents: {
      async update(id: string, params: unknown) {
        console.info("[stripe-mock] paymentIntents.update", id, params);
        return { id, object: "payment_intent", ...(params as object) } as any;
      },
      async create(params: unknown) {
        console.info("[stripe-mock] paymentIntents.create", params);
        return { id: "pi_mock", object: "payment_intent", client_secret: "cs_mock", ...(params as object) } as any;
      },
    },
    subscriptions: {
      async del(id: string) {
        console.info("[stripe-mock] subscriptions.del", id);
        return { id, status: "canceled" } as any;
      },
    },
  };
  return mockStripe as unknown as Stripe;
}

const useMock = process.env.STRIPE_USE_MOCK === "true";
const secret = coreEnv.STRIPE_SECRET_KEY;
const inProd = (process.env.NODE_ENV || "").toLowerCase() === "production";

let stripeClient: Stripe;
if (useMock || (!secret && !inProd)) {
  // Default to a safe mock when explicitly requested or when running tests/dev
  // without a configured secret. Avoid throwing during module init so tests can
  // replace this export with their own mocks as needed.
  stripeClient = createMock();
} else {
  if (!secret) {
    throw new Error("Neither apiKey nor config.authenticator provided");
  }
  stripeClient = new Stripe(secret, {
    apiVersion: "2025-06-30.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const stripe = stripeClient;

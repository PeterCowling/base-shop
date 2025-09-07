// packages/stripe/src/index.ts
import "server-only";

import { coreEnv } from "@acme/config/env/core";
import Stripe from "stripe";

const useMock = process.env.STRIPE_USE_MOCK === "true";
/**
 * Edge-friendly Stripe client.
 *
 * • Uses `createFetchHttpClient` so it works on Cloudflare Workers / Pages.
 * • Pins `apiVersion` to Stripe’s latest GA (“2025-06-30.basil”) so typings
 *   and requests stay in sync.
 * • When `STRIPE_USE_MOCK` is true, exports a lightweight mock that logs
 *   calls and returns predictable dummy data.
 */

let stripeClient: Stripe;

if (useMock) {
  const mockStripe = {
    checkout: {
      sessions: {
        async create(params: unknown) {
          console.info("[stripe-mock] checkout.sessions.create", params);
          return {
            id: "cs_test_mock",
            url: "https://example.com/mock-session",
            object: "checkout.session",
          };
        },
      },
    },
    paymentIntents: {
      async update(id: string, params: unknown) {
        console.info("[stripe-mock] paymentIntents.update", id, params);
        return { id, object: "payment_intent", ...(params as object) };
      },
    },
  };
  stripeClient = mockStripe as unknown as Stripe;
} else {
  const stripeSecret = coreEnv.STRIPE_SECRET_KEY;

  if (!stripeSecret) {
    throw new Error("Neither apiKey nor config.authenticator provided");
  }

  stripeClient = new Stripe(stripeSecret, {
    apiVersion: "2025-06-30.basil",
    httpClient: Stripe.createFetchHttpClient(),
  });
}

export const stripe = stripeClient;

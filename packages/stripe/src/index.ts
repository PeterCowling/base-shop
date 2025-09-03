// packages/stripe/src/index.ts
import "server-only";

import { coreEnv } from "@acme/config/env/core";
import Stripe from "stripe";

/**
 * Edge-friendly Stripe client.
 *
 * • Uses `createFetchHttpClient` so it works on Cloudflare Workers / Pages.
 * • Pins `apiVersion` to Stripe’s latest GA (“2025-06-30.basil”) so typings
 *   and requests stay in sync.
 */
export const stripe = new Stripe(coreEnv.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
  httpClient: Stripe.createFetchHttpClient(),
});

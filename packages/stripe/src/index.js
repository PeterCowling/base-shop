// packages/stripe/src/index.ts
import "server-only";
import { paymentsEnv } from "@acme/config/env/payments";
import Stripe from "stripe";
/**
 * Edge-friendly Stripe client.
 *
 * • Uses `createFetchHttpClient` so it works on Cloudflare Workers / Pages.
 * • Pins `apiVersion` to Stripe’s latest GA (“2025-06-30.basil”) so typings
 *   and requests stay in sync.
 *
 * If you prefer to auto-upgrade on each Stripe release, simply delete the
 * `apiVersion` line and Stripe will default to the newest version whenever
 * you bump the SDK.
 */
export const stripe = new Stripe(paymentsEnv.STRIPE_SECRET_KEY, {
    apiVersion: "2025-06-30.basil",
    httpClient: Stripe.createFetchHttpClient(),
});

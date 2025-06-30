// src/lib/stripeServer.ts
import "server-only";

import { env } from "@config/env";
import Stripe from "stripe";

/**
 * Edge-friendly Stripe client.
 * Make sure STRIPE_SECRET_KEY is set in Cloudflare Pages → Environment Variables.
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  // ✅ value assigned to the normal property
  apiVersion: "2025-05-28.basil",
  // ↳ required for Edge
  httpClient: Stripe.createFetchHttpClient(),
});

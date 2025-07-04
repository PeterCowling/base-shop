import "server-only";
import Stripe from "stripe";
/**
 * Edge-friendly Stripe client.
 * Make sure STRIPE_SECRET_KEY is set in Cloudflare Pages → Environment Variables.
 */
export declare const stripe: Stripe;
//# sourceMappingURL=stripeServer.server.d.ts.map
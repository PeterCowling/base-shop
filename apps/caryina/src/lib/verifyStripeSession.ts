import { stripe } from "@acme/stripe";

export interface VerifyResult {
  paid: boolean;
  amount?: number;
  currency?: string;
}

export async function verifyStripeSession(sessionId: string): Promise<VerifyResult> {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  return {
    paid: session.payment_status === "paid",
    amount: session.amount_total ?? undefined,
    currency: session.currency ?? undefined,
  };
}

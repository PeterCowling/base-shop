import type { PaymentPayload } from "@acme/types";

export async function processPaypalPayment(_payload: PaymentPayload) {
  // placeholder for real PayPal API call
  return { success: true as const };
}

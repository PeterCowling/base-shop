import { sendCampaignEmail } from "./send";

export interface AbandonedCart {
  /** Customer's email address */
  email: string;
  /** Arbitrary cart payload */
  cart: unknown;
  /** Last time the cart was updated */
  updatedAt: number;
  /** Whether a reminder email has already been sent */
  reminded?: boolean;
}

const DAY_MS = 1000 * 60 * 60 * 24;

/**
 * Send reminder emails for carts that have been inactive for at least a day.
 * Carts with `reminded` set to true are ignored. When an email is sent, the
 * record's `reminded` flag is set to true.
 */
export async function recoverAbandonedCarts(
  carts: AbandonedCart[],
  now: number = Date.now()
): Promise<void> {
  for (const record of carts) {
    if (record.reminded) continue;
    if (now - record.updatedAt < DAY_MS) continue;

    await sendCampaignEmail({
      to: record.email,
      subject: "You left items in your cart",
      html: "<p>You left items in your cart.</p>",
    });
    record.reminded = true;
  }
}

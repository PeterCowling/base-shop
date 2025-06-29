import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { stripe } from "../lib/stripeServer";
import {
  markRefunded,
  readOrders,
} from "../platform-core/repositories/rentalOrders";

export async function releaseDepositsOnce(): Promise<void> {
  const shopsDir = join(process.cwd(), "data", "shops");
  const shops = await readdir(shopsDir);
  for (const shop of shops) {
    const orders = await readOrders(shop);
    for (const order of orders) {
      if (order.returnedAt && !order.refundedAt && order.deposit > 0) {
        const session = await stripe.checkout.sessions.retrieve(
          order.sessionId,
          {
            expand: ["payment_intent"],
          }
        );
        const pi =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
        if (!pi) continue;
        const refund = Math.max(order.deposit - (order.damageFee ?? 0), 0);
        if (refund > 0) {
          await stripe.refunds.create({
            payment_intent: pi,
            amount: refund * 100,
          });
        }
        await markRefunded(shop, order.sessionId);
        console.log(`refunded deposit for ${order.sessionId} (${shop})`);
      }
    }
  }
}

export function startDepositReleaseService(
  intervalMs = 1000 * 60 * 60
): () => void {
  async function run() {
    try {
      await releaseDepositsOnce();
    } catch (err) {
      console.error("deposit release failed", err);
    }
  }

  run();
  const id = setInterval(run, intervalMs);
  return () => clearInterval(id);
}

// scripts/src/release-deposits.ts

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { stripe } from "../../packages/lib/src/stripeServer.server";
import {
  markRefunded,
  readOrders,
} from "../../packages/platform-core/src/repositories/rentalOrders.server";

async function processShop(shop: string): Promise<void> {
  const orders = await readOrders(shop);
  for (const order of orders) {
    const deposit = order.deposit ?? 0;
    const sessionId = order.sessionId;
    if (order.returnedAt && !order.refundedAt && deposit > 0 && sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["payment_intent"],
      });
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!pi) continue;
      await stripe.refunds.create({
        payment_intent: pi,
        amount: deposit * 100,
      });
      await markRefunded(shop, sessionId);
      console.log(`refunded deposit for ${sessionId} (${shop})`);
    }
  }
}

async function main(): Promise<void> {
  const shopsDir = join(process.cwd(), "data", "shops");
  const shops = await readdir(shopsDir);
  for (const shop of shops) {
    await processShop(shop);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

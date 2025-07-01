import { stripe } from "@/lib/stripeServer";
import {
  markRefunded,
  readOrders,
} from "@platform-core/repositories/rentalOrders.server";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function processShop(shop: string): Promise<void> {
  const orders = await readOrders(shop);
  for (const order of orders) {
    if (order.returnedAt && !order.refundedAt && order.deposit > 0) {
      const session = await stripe.checkout.sessions.retrieve(order.sessionId, {
        expand: ["payment_intent"],
      });
      const pi =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!pi) continue;
      await stripe.refunds.create({
        payment_intent: pi,
        amount: order.deposit * 100,
      });
      await markRefunded(shop, order.sessionId);
      console.log(`refunded deposit for ${order.sessionId} (${shop})`);
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

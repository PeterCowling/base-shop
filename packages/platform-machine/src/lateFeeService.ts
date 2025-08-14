import { stripe } from "@acme/stripe";
import { readOrders, markLateFeeCharged } from "@platform-core/repositories/rentalOrders.server";
import { getShopById } from "@platform-core/repositories/shop.server";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { logger } from "@platform-core/utils";
import { readdir } from "node:fs/promises";

const DATA_ROOT = resolveDataRoot();

export async function chargeLateFeesOnce(
  shopId?: string,
  dataRoot: string = DATA_ROOT,
): Promise<void> {
  const shops = shopId ? [shopId] : await readdir(dataRoot);
  const now = Date.now();
  for (const shop of shops) {
    let policy: { gracePeriodDays: number; feeAmount: number } | undefined;
    try {
      const cfg = await getShopById(shop);
      policy = cfg.lateFeePolicy as any;
    } catch {
      policy = undefined;
    }
    if (!policy) continue;

    const orders = await readOrders(shop);
    for (const order of orders) {
      if (!order.returnDueDate || order.lateFeeCharged) continue;
      const due = new Date(order.returnDueDate).getTime();
      const graceMs = policy.gracePeriodDays * 24 * 60 * 60 * 1000;
      if (now <= due + graceMs) continue;

      try {
        const session = await stripe.checkout.sessions.retrieve(order.sessionId, {
          expand: ["payment_intent"],
        });
        const currency = session.currency ?? "usd";
        const customer = session.customer as string | undefined;
        const paymentMethod =
          typeof session.payment_intent !== "string"
            ? (session.payment_intent?.payment_method as string | undefined)
            : undefined;
        await stripe.paymentIntents.create({
          amount: policy.feeAmount * 100,
          currency,
          customer,
          payment_method: paymentMethod,
          off_session: true,
          confirm: true,
        });
        await markLateFeeCharged(shop, order.sessionId, policy.feeAmount);
        logger.info("late fee charged", { shopId: shop, sessionId: order.sessionId });
      } catch (err) {
        logger.error("failed to charge late fee", {
          shopId: shop,
          sessionId: order.sessionId,
          err,
        });
      }
    }
  }
}

type LateFeeConfig = {
  enabled: boolean;
  /** Interval in minutes between service runs */
  intervalMinutes: number;
};

const DEFAULT_CONFIG: LateFeeConfig = {
  enabled: false,
  intervalMinutes: 60,
};

export async function startLateFeeService(
  configs: Record<string, Partial<LateFeeConfig>> = {},
  dataRoot: string = DATA_ROOT,
): Promise<() => void> {
  const shops = await readdir(dataRoot);
  const timers: NodeJS.Timeout[] = [];

  await Promise.all(
    shops.map(async (shop) => {
      const cfg = { ...DEFAULT_CONFIG, ...configs[shop] };
      if (!cfg.enabled) return;

      async function run() {
        try {
          await chargeLateFeesOnce(shop, dataRoot);
        } catch (err) {
          logger.error("late fee service failed", { shopId: shop, err });
        }
      }

      await run();
      timers.push(setInterval(run, cfg.intervalMinutes * 60 * 1000));
    }),
  );

  return () => timers.forEach((t) => clearInterval(t));
}

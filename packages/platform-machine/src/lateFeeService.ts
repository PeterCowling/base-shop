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
  for (const shop of shops) {
    const cfg = await getShopById(shop);
    const policy = cfg.lateFeePolicy;
    if (!policy || policy.feeAmount <= 0) continue;
    const orders = await readOrders(shop);
    for (const order of orders) {
      if (
        order.returnDueDate &&
        !order.returnReceivedAt &&
        !order.lateFeeCharged
      ) {
        const due = Date.parse(order.returnDueDate);
        if (Number.isNaN(due)) continue;
        const grace = policy.gracePeriodDays * 24 * 60 * 60 * 1000;
        if (Date.now() <= due + grace) continue;
        try {
          const session = await stripe.checkout.sessions.retrieve(
            order.sessionId,
            { expand: ["customer"] },
          );
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;
          if (!customerId) continue;
          await stripe.paymentIntents.create({
            amount: policy.feeAmount * 100,
            currency: "usd",
            customer: customerId,
            payment_method_types: ["card"],
          });
          await markLateFeeCharged(shop, order.sessionId, policy.feeAmount);
          logger.info("charged late fee", {
            shopId: shop,
            sessionId: order.sessionId,
          });
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

function envKey(shop: string, key: string): string {
  return `LATE_FEE_${key}_${shop.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

async function resolveConfig(
  shop: string,
  dataRoot: string,
  override: Partial<LateFeeConfig> = {},
): Promise<LateFeeConfig> {
  let config: LateFeeConfig = { ...DEFAULT_CONFIG };
  try {
    const cfg = (await getShopById(shop)).lateFeePolicy;
    if (cfg && cfg.feeAmount > 0) config.enabled = true;
  } catch {}

  const envEnabled = process.env[envKey(shop, "ENABLED")];
  if (envEnabled !== undefined) {
    config.enabled = envEnabled !== "false";
  }
  const envInterval = process.env[envKey(shop, "INTERVAL_MS")];
  if (envInterval !== undefined) {
    const num = Number(envInterval);
    if (!Number.isNaN(num)) config.intervalMinutes = Math.round(num / 60000);
  }

  if (override.enabled !== undefined) config.enabled = override.enabled;
  if (override.intervalMinutes !== undefined)
    config.intervalMinutes = override.intervalMinutes;

  return config;
}

export async function startLateFeeService(
  configs: Record<string, Partial<LateFeeConfig>> = {},
  dataRoot: string = DATA_ROOT,
): Promise<() => void> {
  const shops = await readdir(dataRoot);
  const timers: NodeJS.Timeout[] = [];

  await Promise.all(
    shops.map(async (shop) => {
      const cfg = await resolveConfig(shop, dataRoot, configs[shop]);
      if (!cfg.enabled) return;

      async function run() {
        try {
          await chargeLateFeesOnce(shop, dataRoot);
        } catch (err) {
          logger.error("late fee charge failed", { shopId: shop, err });
        }
      }

      await run();
      timers.push(setInterval(run, cfg.intervalMinutes * 60 * 1000));
    }),
  );

  return () => timers.forEach((t) => clearInterval(t));
}

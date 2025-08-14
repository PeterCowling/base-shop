import { coreEnv } from "@acme/config/env/core";
import { stripe } from "@acme/stripe";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  readOrders,
  markLateFeeCharged,
} from "@platform-core/repositories/rentalOrders.server";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { logger } from "@platform-core/utils";

const DATA_ROOT = resolveDataRoot();

export async function chargeLateFeesOnce(
  shopId?: string,
  dataRoot: string = DATA_ROOT,
): Promise<void> {
  const shops = shopId ? [shopId] : await readdir(dataRoot);
  for (const shop of shops) {
    let policy: { gracePeriodDays: number; feeAmount: number } | undefined;
    try {
      const raw = await readFile(join(dataRoot, shop, "shop.json"), "utf8");
      const json = JSON.parse(raw);
      policy = json.lateFeePolicy;
    } catch {
      continue;
    }
    if (!policy || !policy.feeAmount) continue;
    const orders = await readOrders(shop);
    const now = Date.now();
    for (const order of orders) {
      if (!order.returnDueDate || order.returnReceivedAt || order.lateFeeCharged)
        continue;
      const due = new Date(order.returnDueDate).getTime();
      const grace = (policy.gracePeriodDays ?? 0) * 86400000;
      if (now <= due + grace) continue;
      try {
        const session = await stripe.checkout.sessions.retrieve(order.sessionId, {
          expand: ["payment_intent", "customer"],
        });
        const customer =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        const paymentIntent =
          typeof session.payment_intent === "string"
            ? undefined
            : session.payment_intent;
        const paymentMethod = paymentIntent?.payment_method as
          | string
          | undefined;
        if (!customer || !paymentMethod) continue;
        await stripe.paymentIntents.create({
          amount: policy.feeAmount * 100,
          currency: session.currency || "usd",
          customer,
          payment_method: paymentMethod,
          off_session: true,
          confirm: true,
        });
        await markLateFeeCharged(shop, order.sessionId, policy.feeAmount);
        logger.info("late fee charged", {
          shopId: shop,
          sessionId: order.sessionId,
          amount: policy.feeAmount,
        });
      } catch (err) {
        logger.error("late fee charge failed", {
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
    const file = join(dataRoot, shop, "settings.json");
    const json = JSON.parse(await readFile(file, "utf8"));
    const cfg = json.lateFeeService;
    if (cfg) {
      if (typeof cfg.enabled === "boolean") config.enabled = cfg.enabled;
      if (typeof cfg.intervalMinutes === "number")
        config.intervalMinutes = cfg.intervalMinutes;
    }
  } catch {}

  const envEnabled = process.env[envKey(shop, "ENABLED")];
  if (envEnabled !== undefined) {
    config.enabled = envEnabled !== "false";
  } else if (coreEnv.LATE_FEE_ENABLED !== undefined) {
    config.enabled = coreEnv.LATE_FEE_ENABLED;
  }

  const envInterval = process.env[envKey(shop, "INTERVAL_MS")];
  if (envInterval !== undefined) {
    const num = Number(envInterval);
    if (!Number.isNaN(num)) config.intervalMinutes = Math.round(num / 60000);
  } else if (coreEnv.LATE_FEE_INTERVAL_MS !== undefined) {
    config.intervalMinutes = Math.round(coreEnv.LATE_FEE_INTERVAL_MS / 60000);
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
          logger.error("late fee processing failed", { shopId: shop, err });
        }
      }

      await run();
      timers.push(setInterval(run, cfg.intervalMinutes * 60 * 1000));
    }),
  );

  return () => timers.forEach((t) => clearInterval(t));
}

if (process.env.NODE_ENV === "production") {
  startLateFeeService().catch((err) =>
    logger.error("late fee service failed to start", { err }),
  );
}

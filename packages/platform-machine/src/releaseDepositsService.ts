import { stripe } from "@acme/stripe";
import {
  markRefunded,
  readOrders,
} from "@platform-core/repositories/rentalOrders.server";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export async function releaseDepositsOnce(shopId?: string): Promise<void> {
  const shopsDir = join(process.cwd(), "data", "shops");
  const shops = shopId ? [shopId] : await readdir(shopsDir);
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

type DepositReleaseConfig = {
  enabled: boolean;
  intervalMs: number;
};

const DEFAULT_CONFIG: DepositReleaseConfig = {
  enabled: true,
  intervalMs: 1000 * 60 * 60,
};

function envKey(shop: string, key: string): string {
  return `DEPOSIT_RELEASE_${key}_${shop.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

function readEnv(shop: string, key: string): string | undefined {
  return process.env[envKey(shop, key)] ?? process.env[`DEPOSIT_RELEASE_${key}`];
}

async function resolveConfig(
  shop: string,
  override: Partial<DepositReleaseConfig> = {}
): Promise<DepositReleaseConfig> {
  let config: DepositReleaseConfig = { ...DEFAULT_CONFIG };

  try {
    const file = join(process.cwd(), "data", "shops", shop, "shop.json");
    const json = JSON.parse(await readFile(file, "utf8"));
    const cfg = json.depositRelease;
    if (cfg) {
      if (typeof cfg.enabled === "boolean") config.enabled = cfg.enabled;
      if (typeof cfg.intervalMs === "number") config.intervalMs = cfg.intervalMs;
    }
  } catch {}

  const envEnabled = readEnv(shop, "ENABLED");
  if (envEnabled !== undefined) config.enabled = envEnabled !== "false";

  const envInterval = readEnv(shop, "INTERVAL_MS");
  if (envInterval !== undefined) {
    const num = Number(envInterval);
    if (!Number.isNaN(num)) config.intervalMs = num;
  }

  if (override.enabled !== undefined) config.enabled = override.enabled;
  if (override.intervalMs !== undefined) config.intervalMs = override.intervalMs;

  return config;
}

export async function startDepositReleaseService(
  configs: Record<string, Partial<DepositReleaseConfig>> = {}
): Promise<() => void> {
  const shopsDir = join(process.cwd(), "data", "shops");
  const shops = await readdir(shopsDir);
  const timers: NodeJS.Timeout[] = [];

  for (const shop of shops) {
    const cfg = await resolveConfig(shop, configs[shop]);
    if (!cfg.enabled) continue;

    async function run() {
      try {
        await releaseDepositsOnce(shop);
      } catch (err) {
        console.error("deposit release failed", err);
      }
    }

    await run();
    timers.push(setInterval(run, cfg.intervalMs));
  }

  return () => timers.forEach((t) => clearInterval(t));
}

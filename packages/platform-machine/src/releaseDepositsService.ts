import { stripe } from "@acme/stripe";
import {
  markRefunded,
  readOrders,
} from "@platform-core/repositories/rentalOrders.server";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

interface DepositReleaseConfig {
  enabled: boolean;
  intervalMs: number;
}

const defaultConfig: DepositReleaseConfig = {
  enabled: process.env.DEPOSIT_RELEASE_ENABLED
    ? process.env.DEPOSIT_RELEASE_ENABLED !== "false"
    : true,
  intervalMs: process.env.DEPOSIT_RELEASE_INTERVAL_MS
    ? Number(process.env.DEPOSIT_RELEASE_INTERVAL_MS)
    : 1000 * 60 * 60,
};

async function readConfig(shop: string): Promise<DepositReleaseConfig> {
  try {
    const buf = await readFile(
      join(process.cwd(), "data", "shops", shop, "shop.json"),
      "utf8"
    );
    const json = JSON.parse(buf);
    const cfg = json.depositRelease || {};
    return {
      enabled:
        typeof cfg.enabled === "boolean" ? cfg.enabled : defaultConfig.enabled,
      intervalMs:
        typeof cfg.intervalMs === "number"
          ? cfg.intervalMs
          : defaultConfig.intervalMs,
    };
  } catch {
    return { ...defaultConfig };
  }
}
export async function releaseDepositsOnce(shop?: string): Promise<void> {
  const shopsDir = join(process.cwd(), "data", "shops");
  const shops = shop ? [shop] : await readdir(shopsDir);
  for (const s of shops) {
    const cfg = await readConfig(s);
    if (!cfg.enabled) continue;
    const orders = await readOrders(s);
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
        await markRefunded(s, order.sessionId);
        console.log(`refunded deposit for ${order.sessionId} (${s})`);
      }
    }
  }
}

export function startDepositReleaseService(
  overrides: Record<string, Partial<DepositReleaseConfig>> = {}
): () => void {
  const timers: NodeJS.Timeout[] = [];

  (async () => {
    const shopsDir = join(process.cwd(), "data", "shops");
    const shops = await readdir(shopsDir);
    for (const shop of shops) {
      const base = await readConfig(shop);
      const cfg: DepositReleaseConfig = {
        enabled: overrides[shop]?.enabled ?? base.enabled,
        intervalMs: overrides[shop]?.intervalMs ?? base.intervalMs,
      };
      if (!cfg.enabled) continue;

      async function run() {
        try {
          await releaseDepositsOnce(shop);
        } catch (err) {
          console.error("deposit release failed", err);
        }
      }

      run();
      timers.push(setInterval(run, cfg.intervalMs));
    }
  })();

  return () => {
    for (const t of timers) clearInterval(t);
  };
}

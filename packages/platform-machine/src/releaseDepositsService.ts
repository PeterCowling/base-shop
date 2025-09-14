/* eslint-disable security/detect-non-literal-fs-filename -- Paths are derived from internal configuration */
import { coreEnv } from "@acme/config/env/core";
import {
  markRefunded,
  readOrders,
} from "@platform-core/repositories/rentalOrders.server";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { logger } from "@platform-core/utils";
import { readdir, readFile } from "node:fs/promises";
import { join } from "path";

const DATA_ROOT = resolveDataRoot();

let stripePromise:
  | Promise<typeof import("@acme/stripe")["stripe"]>
  | undefined;
async function getStripe() {
  if (!stripePromise) stripePromise = import("@acme/stripe").then((m) => m.stripe);
  return stripePromise;
}

export async function releaseDepositsOnce(
  shopId?: string,
  dataRoot: string = DATA_ROOT,
): Promise<void> {
  const shops = shopId ? [shopId] : await readdir(dataRoot);
  for (const shop of shops) {
    const orders = await readOrders(shop);
    for (const order of orders) {
      if (order.returnedAt && !order.refundedAt && order.deposit > 0) {
        try {
          const stripe = await getStripe();
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
          logger.info("refunded deposit", {
            shopId: shop,
            sessionId: order.sessionId,
          });
        } catch (err) {
          // Include identifiers in the log message so tests can assert on it
          // and operators have useful context when troubleshooting.
          logger.error(
            `failed to release deposit for ${shop} ${order.sessionId}`,
            { err },
          );
          // Also log via console.error so tests and simple environments can
          // detect failures without pino parsing.
          console.error(
            `failed to release deposit for ${shop} ${order.sessionId}`,
            err,
          );
        }
      }
    }
  }
}

type DepositReleaseConfig = {
  enabled: boolean;
  /** Interval in minutes between service runs */
  intervalMinutes: number;
};

const DEFAULT_CONFIG: DepositReleaseConfig = {
  // Enable the service by default; individual shops can disable it via config
  // or environment variables.
  enabled: true,
  intervalMinutes: 60,
};

function envKey(shop: string, key: string): string {
  return `DEPOSIT_RELEASE_${key}_${shop.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

async function resolveConfig(
  shop: string,
  dataRoot: string,
  override: Partial<DepositReleaseConfig> = {},
): Promise<DepositReleaseConfig> {
  const config: DepositReleaseConfig = { ...DEFAULT_CONFIG };
  let enabledSpecified = false;
  let intervalSpecified = false;

  try {
    const file = join(dataRoot, shop, "settings.json");
    const json = JSON.parse(await readFile(file, "utf8"));
    const cfg = json.depositService;
    if (cfg) {
      if (typeof cfg.enabled === "boolean") {
        config.enabled = cfg.enabled;
        enabledSpecified = true;
      }
      if (typeof cfg.intervalMinutes === "number") {
        config.intervalMinutes = cfg.intervalMinutes;
        intervalSpecified = true;
      }
    }
  } catch {}

  const envEnabled = process.env[envKey(shop, "ENABLED")];
  if (envEnabled !== undefined) {
    config.enabled = envEnabled !== "false";
  } else if (!enabledSpecified) {
    if (
      coreEnv.DEPOSIT_RELEASE_ENABLED !== undefined &&
      coreEnv.DEPOSIT_RELEASE_ENABLED !== null
    ) {
      config.enabled = coreEnv.DEPOSIT_RELEASE_ENABLED as boolean;
    }
  }

  const envInterval = process.env[envKey(shop, "INTERVAL_MS")];
  if (envInterval !== undefined) {
    const num = Number(envInterval);
    if (!Number.isNaN(num)) {
      config.intervalMinutes = Math.round(num / 60000);
    } else if (!intervalSpecified && coreEnv.DEPOSIT_RELEASE_INTERVAL_MS != null) {
      config.intervalMinutes = Math.round(
        (coreEnv.DEPOSIT_RELEASE_INTERVAL_MS as number) / 60000,
      );
    }
  } else if (!intervalSpecified && coreEnv.DEPOSIT_RELEASE_INTERVAL_MS != null) {
    config.intervalMinutes = Math.round(
      (coreEnv.DEPOSIT_RELEASE_INTERVAL_MS as number) / 60000,
    );
  }

  if (override.enabled !== undefined) config.enabled = override.enabled;
  if (override.intervalMinutes !== undefined)
    config.intervalMinutes = override.intervalMinutes;

  return config;
}

export async function startDepositReleaseService(
  configs: Record<string, Partial<DepositReleaseConfig>> = {},
  dataRoot: string = DATA_ROOT,
  releaseFn?: typeof releaseDepositsOnce,
  logFn: typeof logger.error = (msg, meta) => logger.error(msg, meta),
): Promise<() => void> {
  const release = releaseFn ?? releaseDepositsOnce;
  const shops = await readdir(dataRoot);
  const timers: NodeJS.Timeout[] = [];

  await Promise.all(
    shops.map(async (shop) => {
      const cfg = await resolveConfig(shop, dataRoot, configs[shop]);
      if (!cfg.enabled) return;

      async function run() {
        try {
          await release(shop, dataRoot);
        } catch (err) {
          logFn("deposit release failed", { shopId: shop, err });
        }
      }

      await run();
      timers.push(setInterval(run, cfg.intervalMinutes * 60 * 1000));
    }),
  );

  return () => timers.forEach((t) => clearInterval(t));
}

// Avoid automatically starting the deposit release service when this module is
// imported. Production environments can opt-in by explicitly setting an
// environment variable.
if (process.env.RUN_DEPOSIT_RELEASE_SERVICE === "true") {
  (async () => {
    try {
      await startDepositReleaseService();
    } catch (err) {
      // Log via both logger and console so that failures surface in
      // environments without structured logging.
      logger.error("failed to start deposit release service", { err });
      console.error("failed to start deposit release service", err);
    }
  })();
}

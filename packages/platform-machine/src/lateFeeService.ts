import { coreEnv } from "@acme/config/env/core";
import { join } from "path";
import { DAY_MS } from "@date-utils";
import {
  readOrders,
  markLateFeeCharged,
} from "@platform-core/repositories/rentalOrders.server";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { logger } from "@platform-core/utils";

const DATA_ROOT = resolveDataRoot();

let stripePromise:
  | Promise<typeof import("@acme/stripe")["stripe"]>
  | undefined;
async function getStripe() {
  if (!stripePromise) stripePromise = import("@acme/stripe").then((m) => m.stripe);
  return stripePromise;
}

export async function chargeLateFeesOnce(
  shopId?: string,
  dataRoot: string = DATA_ROOT,
): Promise<void> {
  const stripe = await getStripe();
  const { readdir, readFile } = await import("fs/promises");
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
      const grace = (policy.gracePeriodDays ?? 0) * DAY_MS;
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

export async function resolveConfig(
  shop: string,
  dataRoot: string,
  override: Partial<LateFeeConfig> = {},
): Promise<LateFeeConfig> {
  const config: LateFeeConfig = { ...DEFAULT_CONFIG };
  let hasFileEnabled = false;
  let hasFileInterval = false;
  try {
    const { readFile } = await import("fs/promises");
    const file = join(dataRoot, shop, "settings.json");
    const json = JSON.parse(await readFile(file, "utf8"));
    const cfg = json.lateFeeService;
    if (cfg) {
      if (typeof cfg.enabled === "boolean") {
        config.enabled = cfg.enabled;
        hasFileEnabled = true;
      }
      if (typeof cfg.intervalMinutes === "number") {
        config.intervalMinutes = cfg.intervalMinutes;
        hasFileInterval = true;
      }
    }
  } catch {}

  const envEnabled = process.env[envKey(shop, "ENABLED")];
  if (envEnabled === "true" || envEnabled === "false") {
    config.enabled = envEnabled === "true";
  } else if (envEnabled === undefined) {
    if (coreEnv.LATE_FEE_ENABLED !== undefined && coreEnv.LATE_FEE_ENABLED !== null)
      config.enabled = coreEnv.LATE_FEE_ENABLED as boolean;
  } else if (
    !hasFileEnabled &&
    coreEnv.LATE_FEE_ENABLED !== undefined &&
    coreEnv.LATE_FEE_ENABLED !== null
  ) {
    config.enabled = coreEnv.LATE_FEE_ENABLED as boolean;
  }

  const envInterval = process.env[envKey(shop, "INTERVAL_MS")];
  if (envInterval !== undefined) {
    const num = Number(envInterval);
    if (!Number.isNaN(num)) {
      config.intervalMinutes = Math.round(num / 60000);
    } else if (
      !hasFileInterval &&
      coreEnv.LATE_FEE_INTERVAL_MS !== undefined &&
      coreEnv.LATE_FEE_INTERVAL_MS !== null
    ) {
      config.intervalMinutes = Math.round(
        (coreEnv.LATE_FEE_INTERVAL_MS as number) / 60000,
      );
    }
  } else if (
    coreEnv.LATE_FEE_INTERVAL_MS !== undefined &&
    coreEnv.LATE_FEE_INTERVAL_MS !== null
  ) {
    config.intervalMinutes = Math.round(
      (coreEnv.LATE_FEE_INTERVAL_MS as number) / 60000,
    );
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
  const { readdir, readFile } = await import("fs/promises");
  const shops = await readdir(dataRoot);
  const timers: NodeJS.Timeout[] = [];

  await Promise.all(
    shops.map(async (shop) => {
      const cfg = await resolveConfig(shop, dataRoot, configs[shop]);
      if (!cfg.enabled) return;

        try {
          const raw = await readFile(join(dataRoot, shop, "shop.json"), "utf8");
          const json = JSON.parse(raw);
          if (json.type === "sale" || !json.lateFeePolicy) return;
        } catch {
          return;
        }

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

const nodeEnvKey = "NODE" + "_ENV";
if (process.env[nodeEnvKey] !== "test") {
  startLateFeeService().catch((err) => {
    logger.error("failed to start late fee service", { err });
  });
}

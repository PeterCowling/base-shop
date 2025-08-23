import { coreEnv } from "@acme/config/env/core";
import type { RentalOrder } from "@acme/types";
import {
  markAvailable,
  markCleaning,
  markQa,
  markReceived,
  markRepair,
} from "@platform-core/repositories/rentalOrders.server";
import { reverseLogisticsEvents } from "@platform-core/repositories/reverseLogisticsEvents.server";
import { resolveDataRoot } from "@platform-core/dataRoot";
import { logger } from "@platform-core/utils";
import { mkdir, readdir, readFile, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const DATA_ROOT = resolveDataRoot();

interface ReverseLogisticsEvent {
  sessionId: string;
  status: NonNullable<RentalOrder["status"]>;
}

export async function writeReverseLogisticsEvent(
  shop: string,
  sessionId: string,
  status: ReverseLogisticsEvent["status"],
  dataRoot: string = DATA_ROOT
): Promise<void> {
  const dir = join(dataRoot, shop, "reverse-logistics");
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${randomUUID()}.json`);
  await writeFile(file, JSON.stringify({ sessionId, status }));
}

export async function processReverseLogisticsEventsOnce(
  shopId?: string,
  dataRoot: string = DATA_ROOT
): Promise<void> {
  const shops = shopId ? [shopId] : await readdir(dataRoot);
  for (const shop of shops) {
    const dir = join(dataRoot, shop, "reverse-logistics");
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      const full = join(dir, file);
      try {
        const raw = await readFile(full, "utf8");
        const evt = JSON.parse(raw) as ReverseLogisticsEvent;
        switch (evt.status) {
          case "received":
            await markReceived(shop, evt.sessionId);
            await reverseLogisticsEvents.received(shop, evt.sessionId);
            break;
          case "cleaning":
            await markCleaning(shop, evt.sessionId);
            await reverseLogisticsEvents.cleaning(shop, evt.sessionId);
            break;
          case "repair":
            await markRepair(shop, evt.sessionId);
            await reverseLogisticsEvents.repair(shop, evt.sessionId);
            break;
          case "qa":
            await markQa(shop, evt.sessionId);
            await reverseLogisticsEvents.qa(shop, evt.sessionId);
            break;
          case "available":
            await markAvailable(shop, evt.sessionId);
            await reverseLogisticsEvents.available(shop, evt.sessionId);
            break;
        }
      } catch (err) {
        logger.error("reverse logistics event failed", {
          shopId: shop,
          file,
          err,
        });
      } finally {
        try {
          await unlink(full);
        } catch {}
      }
    }
  }
}

type ReverseLogisticsConfig = {
  enabled: boolean;
  /** Interval in minutes between service runs */
  intervalMinutes: number;
};

const DEFAULT_CONFIG: ReverseLogisticsConfig = {
  enabled: false,
  intervalMinutes: 60,
};

function envKey(shop: string, key: string): string {
  return `REVERSE_LOGISTICS_${key}_${shop.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`;
}

async function resolveConfig(
  shop: string,
  dataRoot: string,
  override: Partial<ReverseLogisticsConfig> = {}
): Promise<ReverseLogisticsConfig> {
  let config: ReverseLogisticsConfig = { ...DEFAULT_CONFIG };

  try {
    const file = join(dataRoot, shop, "settings.json");
    const json = JSON.parse(await readFile(file, "utf8"));
    const cfg = json.reverseLogisticsService;
    if (cfg) {
      if (typeof cfg.enabled === "boolean") config.enabled = cfg.enabled;
      if (typeof cfg.intervalMinutes === "number")
        config.intervalMinutes = cfg.intervalMinutes;
    }
  } catch {}

  const envEnabled = process.env[envKey(shop, "ENABLED")];
  if (envEnabled !== undefined) {
    config.enabled = envEnabled !== "false";
  } else if (coreEnv.REVERSE_LOGISTICS_ENABLED !== undefined) {
    config.enabled = coreEnv.REVERSE_LOGISTICS_ENABLED;
  }

  const envInterval = process.env[envKey(shop, "INTERVAL_MS")];
  if (envInterval !== undefined) {
    const num = Number(envInterval);
    if (!Number.isNaN(num)) config.intervalMinutes = Math.round(num / 60000);
  } else if (coreEnv.REVERSE_LOGISTICS_INTERVAL_MS !== undefined) {
    config.intervalMinutes = Math.round(
      coreEnv.REVERSE_LOGISTICS_INTERVAL_MS / 60000
    );
  }

  if (override.enabled !== undefined) config.enabled = override.enabled;
  if (override.intervalMinutes !== undefined)
    config.intervalMinutes = override.intervalMinutes;

  return config;
}

export async function startReverseLogisticsService(
  configs: Record<string, Partial<ReverseLogisticsConfig>> = {},
  dataRoot: string = DATA_ROOT
): Promise<() => void> {
  const shops = await readdir(dataRoot);
  const timers: NodeJS.Timeout[] = [];

  await Promise.all(
    shops.map(async (shop) => {
      const cfg = await resolveConfig(shop, dataRoot, configs[shop]);
      if (!cfg.enabled) return;

      async function run() {
        try {
          await processReverseLogisticsEventsOnce(shop, dataRoot);
        } catch (err) {
          logger.error("reverse logistics processing failed", {
            shopId: shop,
            err,
          });
        }
      }

      await run();
      timers.push(setInterval(run, cfg.intervalMinutes * 60 * 1000));
    })
  );

  return () => timers.forEach((t) => clearInterval(t));
}

if (process.env.NODE_ENV !== "test") {
  startReverseLogisticsService().catch((err) =>
    logger.error("failed to start reverse logistics service", { err })
  );
}

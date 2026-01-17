/* eslint-disable security/detect-non-literal-fs-filename -- PLAT-1234: Paths are derived from internal configuration */
import { coreEnv } from "@acme/config/env/core";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { readFile } from "fs/promises";
import { join } from "path";

const DATA_ROOT = resolveDataRoot();

export type ReverseLogisticsConfig = {
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

export async function resolveConfig(
  shop: string,
  dataRoot: string = DATA_ROOT,
  override: Partial<ReverseLogisticsConfig> = {}
): Promise<ReverseLogisticsConfig> {
  const config: ReverseLogisticsConfig = { ...DEFAULT_CONFIG };

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
  } else if (
    coreEnv.REVERSE_LOGISTICS_ENABLED !== undefined &&
    coreEnv.REVERSE_LOGISTICS_ENABLED !== null
  ) {
    config.enabled = coreEnv.REVERSE_LOGISTICS_ENABLED as boolean;
  }

  const envInterval = process.env[envKey(shop, "INTERVAL_MS")];
  if (envInterval !== undefined) {
    const num = Number(envInterval);
    if (!Number.isNaN(num)) config.intervalMinutes = Math.round(num / 60000);
  } else if (
    coreEnv.REVERSE_LOGISTICS_INTERVAL_MS !== undefined &&
    coreEnv.REVERSE_LOGISTICS_INTERVAL_MS !== null
  ) {
    config.intervalMinutes = Math.round(
      (coreEnv.REVERSE_LOGISTICS_INTERVAL_MS as number) / 60000,
    );
  }

  if (override.enabled !== undefined) config.enabled = override.enabled;
  if (override.intervalMinutes !== undefined)
    config.intervalMinutes = override.intervalMinutes;

  return config;
}

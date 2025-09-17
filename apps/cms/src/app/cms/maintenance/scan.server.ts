"use server";

import { runMaintenanceScan } from "@acme/platform-machine/maintenanceScheduler";
import { logger } from "@platform-core/utils";

export interface FlaggedItem {
  message: string;
  shopId: string;
  sku: string;
}

export async function scanForMaintenance(): Promise<FlaggedItem[]> {
  const items: FlaggedItem[] = [];
  const original = logger.info.bind(logger) as typeof logger.info;
  (logger.info as unknown as (
    msg: string,
    meta: { shopId: string; sku: string },
  ) => void) = (msg, meta) => {
    if (msg === "item needs retirement" || msg === "item needs maintenance") {
      items.push({ message: msg, ...meta });
    }
    original(msg, meta);
  };
  try {
    await runMaintenanceScan();
  } finally {
    (logger.info as unknown as typeof original) = original;
  }
  return items;
}

export async function runMaintenanceCheck(): Promise<FlaggedItem[]> {
  return scanForMaintenance();
}

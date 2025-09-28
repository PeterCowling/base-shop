"use server";

import { runMaintenanceScan } from "@acme/platform-machine/maintenanceScheduler";
import { logger } from "@platform-core/utils";

export interface FlaggedItem {
  message: string;
  shopId: string;
  sku: string;
}

// i18n-exempt -- OPS-1203 [ttl=2025-03-31]
export const MSG_ITEM_NEEDS_RETIREMENT = "item needs retirement";
// i18n-exempt -- OPS-1203 [ttl=2025-03-31]
export const MSG_ITEM_NEEDS_MAINTENANCE = "item needs maintenance";

export async function scanForMaintenance(): Promise<FlaggedItem[]> {
  const items: FlaggedItem[] = [];
  const original = logger.info.bind(logger) as typeof logger.info;
  (logger.info as unknown as (
    msg: string,
    meta: { shopId: string; sku: string },
  ) => void) = (msg, meta) => {
    if (msg === MSG_ITEM_NEEDS_RETIREMENT || msg === MSG_ITEM_NEEDS_MAINTENANCE) {
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

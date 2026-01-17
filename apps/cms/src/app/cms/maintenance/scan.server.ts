"use server";

import { runMaintenanceScan } from "@acme/platform-machine/maintenanceScheduler";
import { logger } from "@acme/platform-core/utils";
import type { FlaggedItem } from "./types";
import { MSG_ITEM_NEEDS_MAINTENANCE, MSG_ITEM_NEEDS_RETIREMENT } from "./constants";

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

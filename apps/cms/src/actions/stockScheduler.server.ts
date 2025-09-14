"use server";

// apps/cms/src/actions/stockScheduler.server.ts

import { scheduleStockChecks, getStockCheckStatus } from "@platform-core/services/stockScheduler.server";
import { readInventory } from "@platform-core/repositories/inventory.server";

export async function updateStockScheduler(shop: string, formData: FormData) {
  const intervalStr = formData.get("intervalMs");
  const intervalMs = Number(intervalStr);
  if (!intervalMs || intervalMs <= 0) return;
  scheduleStockChecks(shop, () => readInventory(shop), intervalMs);
}

export async function getSchedulerStatus(shop: string) {
  return getStockCheckStatus(shop);
}

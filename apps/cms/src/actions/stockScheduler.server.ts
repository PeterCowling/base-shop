"use server";

// apps/cms/src/actions/stockScheduler.server.ts

import { readInventory } from "@acme/platform-core/repositories/inventory.server";
import { getStockCheckStatus,scheduleStockChecks } from "@acme/platform-core/services/stockScheduler.server";

interface StockCheckStatus {
  intervalMs: number;
  lastRun?: number;
  history: { timestamp: number; alerts: number }[];
}

export async function updateStockScheduler(shop: string, formData: FormData) {
  const intervalStr = formData.get("intervalMs");
  const intervalMs = Number(intervalStr);
  if (!intervalMs || intervalMs <= 0) return;
  scheduleStockChecks(shop, (() => readInventory(shop)) as any, intervalMs);
}

export async function getSchedulerStatus(shop: string): Promise<StockCheckStatus | undefined> {
  return getStockCheckStatus(shop) as StockCheckStatus | undefined;
}

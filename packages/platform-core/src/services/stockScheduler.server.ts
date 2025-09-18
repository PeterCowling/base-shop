import "server-only";

import type { InventoryItem } from "../types/inventory";
import { checkAndAlert } from "./stockAlert.server";

interface HistoryEntry {
  timestamp: number;
  alerts: number;
}

interface StockCheckStatus {
  intervalMs: number;
  lastRun?: number;
  history: HistoryEntry[];
}

const schedules = new Map<string, { timer: NodeJS.Timeout; status: StockCheckStatus }>();

/**
 * Periodically runs {@link checkAndAlert} for a shop.
 * @param shop The shop identifier.
 * @param getItems Function returning the latest inventory items.
 * @param intervalMs Interval in milliseconds between checks (default 1h).
 *
 * Uses a single long-lived interval, so memory usage remains constant. If
 * {@link checkAndAlert} takes longer than the interval, calls may overlap and
 * create backpressure; consider a queue or adaptive schedule for heavy loads.
 */
export function scheduleStockChecks(
  shop: string,
  getItems: () => Promise<InventoryItem[]>,
  intervalMs = 60 * 60 * 1000,
): StockCheckStatus {
  const existing = schedules.get(shop);
  if (existing?.timer) {
    clearInterval(existing.timer);
  }

  const status: StockCheckStatus = {
    intervalMs,
    history: [],
  };

  const run = async () => {
    try {
      const items = await getItems();
      const lowItems = await checkAndAlert(shop, items);
      const ts = Date.now();
      status.lastRun = ts;
      status.history.push({ timestamp: ts, alerts: lowItems.length });
      if (status.history.length > 10) status.history.shift();
    } catch (err) {
      console.error("Scheduled stock check failed", err);
    }
  };

  const timer = setInterval(run, intervalMs);
  schedules.set(shop, { timer, status });
  return status;
}

export function getStockCheckStatus(shop: string): StockCheckStatus | undefined {
  return schedules.get(shop)?.status;
}

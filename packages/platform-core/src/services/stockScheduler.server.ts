import "server-only";

import type { InventoryItem } from "../types/inventory";
import { checkAndAlert } from "./stockAlert.server";

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
): void {
  setInterval(async () => {
    try {
      const items = await getItems();
      await checkAndAlert(shop, items);
    } catch (err) {
      console.error("Scheduled stock check failed", err);
    }
  }, intervalMs);
}

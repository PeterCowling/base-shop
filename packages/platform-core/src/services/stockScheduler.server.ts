import "server-only";

import type { InventoryItem } from "@types";
import { checkAndAlert } from "./stockAlert.server";

/**
 * Periodically runs {@link checkAndAlert} for a shop.
 * @param shop The shop identifier.
 * @param getItems Function returning the latest inventory items.
 * @param intervalMs Interval in milliseconds between checks (default 1h).
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

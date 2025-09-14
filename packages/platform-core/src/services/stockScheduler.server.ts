import "server-only";

import type { InventoryItem } from "../types/inventory";
import { checkAndAlert } from "./stockAlert.server";
import { promises as fs } from "fs";
import * as path from "path";
import { DATA_ROOT } from "../dataRoot";

interface HistoryEntry {
  runAt: number;
  alertCount: number;
}

const HISTORY_FILE = "stock-check-history.json";

async function readHistory(shop: string): Promise<HistoryEntry[]> {
  try {
    const p = path.join(DATA_ROOT, shop, HISTORY_FILE);
    const buf = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(buf);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function appendHistory(shop: string, entry: HistoryEntry) {
  const history = await readHistory(shop);
  history.push(entry);
  const p = path.join(DATA_ROOT, shop, HISTORY_FILE);
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(history.slice(-20), null, 2), "utf8");
}

export async function getStockCheckHistory(shop: string) {
  return readHistory(shop);
}

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
      const alertCount = await checkAndAlert(shop, items);
      await appendHistory(shop, { runAt: Date.now(), alertCount: alertCount ?? 0 });
    } catch (err) {
      console.error("Scheduled stock check failed", err);
    }
  }, intervalMs);
}

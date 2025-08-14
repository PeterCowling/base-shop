import "server-only";

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { DATA_ROOT } from "../dataRoot";
import { validateShopName } from "../shops";
import type { ReverseLogisticsEvent } from "@acme/types";

function eventsPath(shop: string): string {
  shop = validateShopName(shop);
  return path.join(DATA_ROOT, shop, "reverse-logistics-events.jsonl");
}

export async function addEvent(
  shop: string,
  event: ReverseLogisticsEvent,
): Promise<void> {
  const file = eventsPath(shop);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.appendFile(file, JSON.stringify(event) + "\n", "utf8");
}

export async function listEvents(
  shop: string,
): Promise<ReverseLogisticsEvent[]> {
  try {
    const buf = await fs.readFile(eventsPath(shop), "utf8");
    return buf
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ReverseLogisticsEvent);
  } catch {
    return [];
  }
}

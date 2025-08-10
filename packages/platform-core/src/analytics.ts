export type PageViewEvent = {
  type: "page_view";
  url: string;
};

export type OrderEvent = {
  type: "order";
  orderId: string;
  amount: number;
};

export type AnalyticsEvent = PageViewEvent | OrderEvent;

export interface AnalyticsProvider {
  track(event: AnalyticsEvent): void | Promise<void>;
}

class NoopProvider implements AnalyticsProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  track(_event: AnalyticsEvent): void {}
}

let provider: AnalyticsProvider = new NoopProvider();

export function setAnalyticsProvider(p: AnalyticsProvider): void {
  provider = p;
}

export function logEvent(event: AnalyticsEvent): void | Promise<void> {
  return provider.track(event);
}

export function logPageView(url: string): void | Promise<void> {
  return logEvent({ type: "page_view", url });
}

export function logOrder(orderId: string, amount: number): void | Promise<void> {
  return logEvent({ type: "order", orderId, amount });
}

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { DATA_ROOT } from "./dataRoot";
import { nowIso } from "@shared/date";

export class FileAnalyticsProvider implements AnalyticsProvider {
  constructor(private shopId: string) {}

  async track(event: AnalyticsEvent): Promise<void> {
    const dir = path.join(DATA_ROOT, this.shopId);
    await fs.mkdir(dir, { recursive: true });
    const line = JSON.stringify({ timestamp: nowIso(), ...event }) + "\n";
    await fs.appendFile(path.join(dir, "analytics.jsonl"), line, "utf8");
  }
}

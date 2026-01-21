import "server-only";

import { nowIso } from "@acme/date-utils";
import type { ReverseLogisticsEvent, ReverseLogisticsEventName } from "@acme/types";

import { prisma } from "../db";

/**
 * Insert a reverse logistics event for a rental session.
 *
 * @param shop - Shop identifier.
 * @param sessionId - Rental session ID.
 * @param event - Stage name to record.
 * @param createdAt - ISO timestamp; defaults to now.
 */
export async function recordEvent(
  shop: string,
  sessionId: string,
  event: ReverseLogisticsEventName,
  createdAt: string = nowIso()
): Promise<void> {
  await prisma.reverseLogisticsEvent.create({
    data: { shop, sessionId, event, createdAt },
  });
}

/**
 * Retrieve all events for a shop ordered chronologically.
 *
 * @param shop - Shop identifier.
 */
export async function listEvents(
  shop: string
): Promise<ReverseLogisticsEvent[]> {
  const events = (await prisma.reverseLogisticsEvent.findMany({
    where: { shop },
    orderBy: { createdAt: "asc" },
  })) as ReverseLogisticsEvent[];

  return events.map((evt) => ({
    ...evt,
    event: evt.event as ReverseLogisticsEventName,
  }));
}

/** Convenience helpers for common reverse logistics events. */
async function delegate(
  event: ReverseLogisticsEventName,
  shop: string,
  sessionId: string,
  createdAt: string
) {
  const mod = await import("./reverseLogisticsEvents.server");
  return mod.recordEvent(shop, sessionId, event, createdAt);
}

export const reverseLogisticsEvents = {
  /** Record that a returned item was received into inventory. */
  received: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    delegate("received", shop, sessionId, createdAt),
  /** Record that an item is being cleaned. */
  cleaning: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    delegate("cleaning", shop, sessionId, createdAt),
  /** Record that an item is undergoing repair. */
  repair: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    delegate("repair", shop, sessionId, createdAt),
  /** Record that an item is in quality assurance. */
  qa: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    delegate("qa", shop, sessionId, createdAt),
  /** Record that an item is available for rental again. */
  available: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    delegate("available", shop, sessionId, createdAt),
};

import "server-only";

import { nowIso } from "@acme/date-utils";
import { prisma } from "../db";
import type { ReverseLogisticsEvent, ReverseLogisticsEventName } from "@acme/types";

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
  return await prisma.reverseLogisticsEvent.findMany({
    where: { shop },
    orderBy: { createdAt: "asc" },
  });
}

/** Convenience helpers for common reverse logistics events. */
export const reverseLogisticsEvents = {
  /** Record that a returned item was received into inventory. */
  received: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "received", createdAt),
  /** Record that an item is being cleaned. */
  cleaning: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "cleaning", createdAt),
  /** Record that an item is undergoing repair. */
  repair: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "repair", createdAt),
  /** Record that an item is in quality assurance. */
  qa: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "qa", createdAt),
  /** Record that an item is available for rental again. */
  available: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "available", createdAt),
};

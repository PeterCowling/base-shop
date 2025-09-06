import "server-only";

import { nowIso } from "@acme/date-utils";
import { prisma } from "../db";
import type { ReverseLogisticsEvent, ReverseLogisticsEventName } from "@acme/types";

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

export async function listEvents(
  shop: string
): Promise<ReverseLogisticsEvent[]> {
  return await prisma.reverseLogisticsEvent.findMany({
    where: { shop },
    orderBy: { createdAt: "asc" },
  });
}

export const reverseLogisticsEvents = {
  received: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "received", createdAt),
  cleaning: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "cleaning", createdAt),
  repair: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "repair", createdAt),
  qa: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "qa", createdAt),
  available: (shop: string, sessionId: string, createdAt: string = nowIso()) =>
    recordEvent(shop, sessionId, "available", createdAt),
};

import "server-only";

import { nowIso } from "@acme/date-utils";
import { prisma } from "../db";

export type ReverseLogisticsEventName =
  | "received"
  | "cleaning"
  | "repair"
  | "qa"
  | "available"
  | `status:${string}`;

export type ReverseLogisticsEvent = {
  id: string;
  shop: string;
  sessionId: string;
  event: ReverseLogisticsEventName;
  createdAt: string;
};

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

export async function recordStatus(
  shop: string,
  sessionId: string,
  status: string,
  createdAt: string = nowIso(),
): Promise<void> {
  await recordEvent(shop, sessionId, `status:${status}`, createdAt);
}

export async function getLatestStatus(
  shop: string,
  sessionId: string,
): Promise<string | null> {
  const event = await prisma.reverseLogisticsEvent.findFirst({
    where: { shop, sessionId, event: { startsWith: "status:" } },
    orderBy: { createdAt: "desc" },
  });
  return event ? event.event.slice(7) : null;
}

export async function listEvents(
  shop: string
): Promise<ReverseLogisticsEvent[]> {
  return (await prisma.reverseLogisticsEvent.findMany({
    where: { shop },
    orderBy: { createdAt: "asc" },
  })) as unknown as ReverseLogisticsEvent[];
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

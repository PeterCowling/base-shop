import "server-only";

import { nowIso } from "@acme/date-utils";
import { prisma } from "../db";

export type ReverseLogisticsEvent = {
  id: string;
  shop: string;
  sessionId: string;
  event: string;
  createdAt: string;
};

export async function recordEvent(
  shop: string,
  sessionId: string,
  event: string,
  createdAt: string = nowIso(),
): Promise<void> {
  await prisma.reverseLogisticsEvent.create({
    data: { shop, sessionId, event, createdAt },
  });
}

export async function listEvents(
  shop: string,
): Promise<ReverseLogisticsEvent[]> {
  return (await prisma.reverseLogisticsEvent.findMany({
    where: { shop },
    orderBy: { createdAt: "asc" },
  })) as unknown as ReverseLogisticsEvent[];
}

import "server-only";
import { ulid } from "ulid";
import { nowIso } from "@acme/date-utils";
import type { ReverseLogisticsEvent } from "@acme/types";
import { prisma } from "../db";

export async function recordReverseLogisticsEvent(
  shop: string,
  sessionId: string,
  event: ReverseLogisticsEvent["event"],
): Promise<void> {
  await prisma.reverseLogisticsEvent.create({
    data: { id: ulid(), shop, sessionId, event, at: nowIso() },
  });
}

export async function listReverseLogisticsEvents(
  shop: string,
  sessionId: string,
): Promise<ReverseLogisticsEvent[]> {
  return prisma.reverseLogisticsEvent.findMany({ where: { shop, sessionId } });
}

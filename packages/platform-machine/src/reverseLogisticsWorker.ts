import { addEvent } from "@platform-core/repositories/reverseLogisticsEvents.server";

export type ReverseLogisticsEventType = "received" | "cleaned" | "qaPassed";

export async function emitReverseLogisticsEvent(
  shop: string,
  sessionId: string,
  event: ReverseLogisticsEventType,
): Promise<void> {
  await addEvent(shop, {
    sessionId,
    event,
    at: new Date().toISOString(),
  });
}

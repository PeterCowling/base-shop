import { recordReverseLogisticsEvent } from "@platform-core/repositories/reverseLogisticsEvents.server";
import { logger } from "@platform-core/utils";

async function emit(
  shop: string,
  sessionId: string,
  event: "received" | "cleaned" | "qaPassed",
): Promise<void> {
  await recordReverseLogisticsEvent(shop, sessionId, event);
  logger.info(`reverse logistics ${event}`, { shopId: shop, sessionId });
}

export const reverseLogisticsWorker = {
  async received(shop: string, sessionId: string) {
    await emit(shop, sessionId, "received");
  },
  async cleaned(shop: string, sessionId: string) {
    await emit(shop, sessionId, "cleaned");
  },
  async qaPassed(shop: string, sessionId: string) {
    await emit(shop, sessionId, "qaPassed");
  },
};

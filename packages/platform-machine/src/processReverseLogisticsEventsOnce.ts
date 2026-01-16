/* eslint-disable security/detect-non-literal-fs-filename -- PLAT-1234: Paths are derived from internal configuration */
import { markAvailable, markCleaning, markQa, markReceived, markRepair } from "@acme/platform-core/repositories/rentalOrders.server";
import { reverseLogisticsEvents } from "@acme/platform-core/repositories/reverseLogisticsEvents.server";
import { resolveDataRoot } from "@acme/platform-core/dataRoot";
import { logger } from "@acme/platform-core/utils";
import { readdir, readFile, unlink } from "fs/promises";
import { join } from "path";
import type { ReverseLogisticsEvent } from "./writeReverseLogisticsEvent";

const DATA_ROOT = resolveDataRoot();

export async function processReverseLogisticsEventsOnce(
  shopId?: string,
  dataRoot: string = DATA_ROOT
): Promise<void> {
  const shops = shopId ? [shopId] : await readdir(dataRoot);
  for (const shop of shops) {
    const dir = join(dataRoot, shop, "reverse-logistics");
    let files: string[] = [];
    try {
      files = await readdir(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      const full = join(dir, file);
      try {
        const raw = await readFile(full, "utf8");
        const evt = JSON.parse(raw) as ReverseLogisticsEvent;
        switch (evt.status) {
          case "received":
            await markReceived(shop, evt.sessionId);
            await reverseLogisticsEvents.received(shop, evt.sessionId);
            break;
          case "cleaning":
            await markCleaning(shop, evt.sessionId);
            await reverseLogisticsEvents.cleaning(shop, evt.sessionId);
            break;
          case "repair":
            await markRepair(shop, evt.sessionId);
            await reverseLogisticsEvents.repair(shop, evt.sessionId);
            break;
          case "qa":
            await markQa(shop, evt.sessionId);
            await reverseLogisticsEvents.qa(shop, evt.sessionId);
            break;
          case "available":
            await markAvailable(shop, evt.sessionId);
            await reverseLogisticsEvents.available(shop, evt.sessionId);
            break;
        }
      } catch (err) {
        // i18n-exempt: OPS-1234 technical log, not user-facing
        logger.error("reverse logistics event failed", {
          shopId: shop,
          file,
          err,
        });
      } finally {
        try {
          await unlink(full);
        } catch {}
      }
    }
  }
}

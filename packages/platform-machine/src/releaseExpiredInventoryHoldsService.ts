import "server-only";

import { prisma } from "@platform-core/db";
import { releaseInventoryHold } from "@platform-core/inventoryHolds";
import { logger } from "@platform-core/utils";

export type ReleaseExpiredInventoryHoldsResult = {
  scanned: number;
  released: number;
  alreadyReleased: number;
  skippedCommitted: number;
  failed: number;
};

export async function releaseExpiredInventoryHoldsOnce(params: {
  now?: Date;
  limit?: number;
} = {}): Promise<ReleaseExpiredInventoryHoldsResult> {
  const now = params.now ?? new Date();
  const limit = typeof params.limit === "number" && params.limit > 0 ? params.limit : 100;

  const db = prisma as unknown as {
    inventoryHold?: {
      findMany: (args: unknown) => Promise<Array<{ shopId: string; holdId: string }>>;
    };
  };
  if (!db.inventoryHold) {
    throw new Error("Inventory hold store is unavailable"); // i18n-exempt -- internal error message
  }

  const holds = await db.inventoryHold.findMany({
    where: { status: "active", expiresAt: { lt: now } },
    take: limit,
  });

  let released = 0;
  let alreadyReleased = 0;
  let skippedCommitted = 0;
  let failed = 0;

  for (const hold of holds) {
    try {
      const result = await releaseInventoryHold({
        shopId: hold.shopId,
        holdId: hold.holdId,
        reason: "expired",
        now,
      });
      if (result.ok) {
        if (result.status === "released") released += 1;
        if (result.status === "already_released") alreadyReleased += 1;
      } else if (result.reason === "committed") {
        skippedCommitted += 1;
      }
    } catch (err) {
      failed += 1;
      // i18n-exempt: OPS-4321 technical log, not user-facing
      logger.error("failed to release expired inventory hold", {
        shopId: hold.shopId,
        holdId: hold.holdId,
        err,
      });
    }
  }

  if (holds.length) {
    // i18n-exempt: OPS-4321 technical log, not user-facing
    logger.info("expired inventory holds processed", {
      scanned: holds.length,
      released,
      alreadyReleased,
      skippedCommitted,
      failed,
    });
  }

  return {
    scanned: holds.length,
    released,
    alreadyReleased,
    skippedCommitted,
    failed,
  };
}

const DEFAULT_INTERVAL_MS = 60 * 1000;

export function startExpiredInventoryHoldReleaseService(params: {
  intervalMs?: number;
  limit?: number;
  releaseFn?: typeof releaseExpiredInventoryHoldsOnce;
} = {}): () => void {
  const intervalMs =
    typeof params.intervalMs === "number" && params.intervalMs > 0
      ? params.intervalMs
      : DEFAULT_INTERVAL_MS;
  const limit =
    typeof params.limit === "number" && params.limit > 0 ? params.limit : 100;
  const release = params.releaseFn ?? releaseExpiredInventoryHoldsOnce;

  async function run() {
    try {
      await release({ limit });
    } catch (err) {
      // i18n-exempt: OPS-4321 technical log, not user-facing
      logger.error("expired inventory hold release failed", { err });
    }
  }

  void run();
  const timer = setInterval(run, intervalMs) as NodeJS.Timeout;
  timer.unref?.();
  return () => clearInterval(timer);
}

if (process.env.RUN_EXPIRED_INVENTORY_HOLD_RELEASE_SERVICE === "true") {
  startExpiredInventoryHoldReleaseService();
}

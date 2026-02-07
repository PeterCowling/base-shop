import "server-only";

import { ulid } from "ulid";

import { prisma } from "./db";
import type { InventoryHoldDb, InventoryHoldItemRow } from "./inventoryHolds.db";
import {
  InventoryBusyError,
  InventoryHoldInsufficientError,
} from "./inventoryHolds.errors";
import { releaseExpiredInventoryHolds } from "./inventoryHolds.reaper";
import {
  getInventoryLockTimeoutMs,
  getInventoryRetryAfterMs,
  isInventoryBusyError,
  normalizeHoldRequests,
  setLocalLockTimeout,
} from "./inventoryHolds.utils";
import type { InventoryValidationFailure, InventoryValidationRequest } from "./inventoryValidation";
import { validateShopName } from "./shops";

export { InventoryBusyError, InventoryHoldInsufficientError };

export async function createInventoryHold(params: {
  shopId: string;
  requests: InventoryValidationRequest[];
  ttlSeconds?: number;
  reapLimit?: number;
}): Promise<{ holdId: string; expiresAt: Date }> {
  const shopId = validateShopName(params.shopId);
  const requested = normalizeHoldRequests(params.requests);
  if (requested.length === 0) {
    throw new Error("Missing inventory hold items"); // i18n-exempt -- internal error message
  }

  const ttlSeconds =
    typeof params.ttlSeconds === "number" && Number.isFinite(params.ttlSeconds)
      ? Math.max(30, Math.floor(params.ttlSeconds))
      : 20 * 60;
  const reapLimit =
    typeof params.reapLimit === "number" && Number.isFinite(params.reapLimit)
      ? Math.max(0, Math.floor(params.reapLimit))
      : 25;

  const holdId = ulid();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

  const db = prisma as unknown as InventoryHoldDb;
  if (!db.inventoryItem) {
    throw new Error("Inventory backend unavailable"); // i18n-exempt -- internal error message
  }

  try {
    return await db.$transaction(async (tx) => {
      await setLocalLockTimeout(tx, getInventoryLockTimeoutMs());
      if (reapLimit > 0) {
        await releaseExpiredInventoryHolds({ shopId, limit: reapLimit, tx, now });
      }

      const itemsForHold: InventoryHoldItemRow[] = [];
      const insufficient: InventoryValidationFailure[] = [];

      for (const entry of requested) {
        if (!Number.isInteger(entry.requested) || entry.requested <= 0) continue;

        const record = await tx.inventoryItem!.findUnique({
          where: {
            shopId_sku_variantKey: {
              shopId,
              sku: entry.sku,
              variantKey: entry.variantKey,
            },
          },
        });

        const available = typeof record?.quantity === "number" ? record.quantity : 0;
        const productId = typeof record?.productId === "string" ? record.productId : "";
        if (!record || !productId || available < entry.requested) {
          insufficient.push({ ...entry, available });
          continue;
        }

        const updated = await tx.inventoryItem!.updateMany({
          where: {
            shopId,
            sku: entry.sku,
            variantKey: entry.variantKey,
            quantity: { gte: entry.requested },
          },
          data: {
            quantity: { decrement: entry.requested },
          },
        });
        if (updated.count !== 1) {
          const refreshed = await tx.inventoryItem!.findUnique({
            where: {
              shopId_sku_variantKey: {
                shopId,
                sku: entry.sku,
                variantKey: entry.variantKey,
              },
            },
          });
          const refreshedQty = typeof refreshed?.quantity === "number" ? refreshed.quantity : 0;
          insufficient.push({ ...entry, available: refreshedQty });
          continue;
        }

        itemsForHold.push({
          holdId,
          shopId,
          sku: entry.sku,
          productId,
          variantKey: entry.variantKey,
          variantAttributes: entry.variantAttributes,
          quantity: entry.requested,
        });
      }

      if (insufficient.length) {
        throw new InventoryHoldInsufficientError(insufficient);
      }

      await tx.inventoryHold.create({
        data: {
          id: holdId,
          shopId,
          status: "active",
          expiresAt,
        },
      });

      await tx.inventoryHoldItem.createMany({
        data: itemsForHold,
      });

      return { holdId, expiresAt };
    });
  } catch (err) {
    if (err instanceof InventoryHoldInsufficientError) throw err;
    if (isInventoryBusyError(err)) {
      throw new InventoryBusyError("Inventory busy", getInventoryRetryAfterMs());
    }
    throw err;
  }
}

export async function extendInventoryHold(params: {
  shopId: string;
  holdId: string;
  ttlSeconds: number;
}): Promise<void> {
  const shopId = validateShopName(params.shopId);
  const holdId = params.holdId.trim();
  if (!holdId) throw new Error("Missing hold id"); // i18n-exempt -- internal error message
  const ttlSeconds = Math.max(30, Math.floor(params.ttlSeconds));

  const db = prisma as unknown as InventoryHoldDb;
  await db.$transaction(async (tx) => {
    const hold = await tx.inventoryHold.findUnique({ where: { id: holdId } });
    if (!hold || hold.shopId !== shopId) {
      throw new Error("Inventory hold not found"); // i18n-exempt -- internal error message
    }
    if (hold.status !== "active") return;

    const now = new Date();
    const base = hold.expiresAt > now ? hold.expiresAt : now;
    const nextExpiresAt = new Date(base.getTime() + ttlSeconds * 1000);
    await tx.inventoryHold.updateMany({
      where: { id: holdId, shopId, status: "active" },
      data: { expiresAt: nextExpiresAt },
    });
  });
}

export async function commitInventoryHold(params: {
  shopId: string;
  holdId: string;
}): Promise<void> {
  const shopId = validateShopName(params.shopId);
  const holdId = params.holdId.trim();
  if (!holdId) throw new Error("Missing hold id"); // i18n-exempt -- internal error message

  const db = prisma as unknown as InventoryHoldDb;
  await db.$transaction(async (tx) => {
    const hold = await tx.inventoryHold.findUnique({ where: { id: holdId } });
    if (!hold || hold.shopId !== shopId) {
      throw new Error("Inventory hold not found"); // i18n-exempt -- internal error message
    }
    if (hold.status === "committed") return;
    if (hold.status !== "active") {
      throw new Error(`Inventory hold is not active (${hold.status})`); // i18n-exempt -- internal error message
    }

    await tx.inventoryHold.updateMany({
      where: { id: holdId, shopId, status: "active" },
      data: { status: "committed", committedAt: new Date() },
    });
  });
}

export type ReleaseInventoryHoldResult =
  | { ok: true; status: "released" | "already_released" }
  | { ok: false; reason: "not_found" | "committed" };

export async function releaseInventoryHold(params: {
  shopId: string;
  holdId: string;
  reason?: string;
  now?: Date;
}): Promise<ReleaseInventoryHoldResult> {
  const shopId = validateShopName(params.shopId);
  const holdId = params.holdId.trim();
  if (!holdId) throw new Error("Missing hold id"); // i18n-exempt -- internal error message

  const db = prisma as unknown as InventoryHoldDb;
  if (!db.inventoryItem) {
    throw new Error("Inventory backend unavailable"); // i18n-exempt -- internal error message
  }

  const releaseResult = await db.$transaction(async (tx) => {
    const hold = await tx.inventoryHold.findUnique({ where: { id: holdId } });
    if (!hold || hold.shopId !== shopId) {
      return { ok: false as const, reason: "not_found" as const };
    }
    if (hold.status === "committed") {
      return { ok: false as const, reason: "committed" as const };
    }
    if (hold.status !== "active") {
      return { ok: true as const, status: "already_released" as const };
    }

    const updated = await tx.inventoryHold.updateMany({
      where: { id: holdId, shopId, status: "active" },
      data: { status: "released", releasedAt: params.now ?? new Date() },
    });
    if (updated.count !== 1) {
      return { ok: true as const, status: "already_released" as const };
    }

    const items = await tx.inventoryHoldItem.findMany({ where: { holdId } });
    for (const item of items) {
      const current = await tx.inventoryItem!.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId,
            sku: item.sku,
            variantKey: item.variantKey,
          },
        },
      });

      if (current) {
        await tx.inventoryItem!.updateMany({
          where: { shopId, sku: item.sku, variantKey: item.variantKey },
          data: { quantity: { increment: item.quantity } },
        });
        continue;
      }

      await tx.inventoryItem!.upsert({
        where: {
          shopId_sku_variantKey: { shopId, sku: item.sku, variantKey: item.variantKey },
        },
        create: {
          shopId,
          sku: item.sku,
          productId: item.productId,
          variantKey: item.variantKey,
          variantAttributes: item.variantAttributes,
          quantity: item.quantity,
        },
        update: {
          quantity: { increment: item.quantity },
        },
      });
    }

    return { ok: true as const, status: "released" as const };
  });

  return releaseResult;
}

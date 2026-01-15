/** @jest-environment node */

import { prisma } from "../src/db";
import { createInventoryHold, extendInventoryHold } from "../src/inventoryHolds";
import { variantKey } from "../src/types/inventory";

describe("inventoryHolds", () => {
  describe("createInventoryHold", () => {
    it("returns inventory_busy on Prisma write conflicts", async () => {
      const originalTransaction = (prisma as unknown as { $transaction: unknown }).$transaction;
      const throwWriteConflict = async () => {
        const err = new Error("Write conflict"); // i18n-exempt -- internal error message
        Object.assign(err, { code: "P2034" });
        throw err;
      };
      (prisma as unknown as { $transaction: unknown }).$transaction = throwWriteConflict;

      try {
        const shopId = "shop_inventory_test";
        const holdId = "hold_write_conflict";

        const result = await createInventoryHold({
          shopId,
          holdId,
          requests: [
            { sku: "SKU1", quantity: 1, variantAttributes: { size: "M" } },
            { sku: "SKU1", quantity: 2, variantAttributes: { size: "M" } },
          ],
          ttlMs: 60_000,
          now: new Date("2025-01-01T00:00:00.000Z"),
        });

        expect(result).toEqual({
          ok: false,
          reason: "inventory_busy",
          shopId,
          retryAfterMs: 250,
          items: [
            {
              sku: "SKU1",
              quantity: 3,
              variantAttributes: { size: "M" },
              variantKey: variantKey("SKU1", { size: "M" }),
            },
          ],
        });
      } finally {
        (prisma as unknown as { $transaction: unknown }).$transaction = originalTransaction;
      }
    });
  });

  describe("extendInventoryHold", () => {
    it("returns not_found when hold does not exist", async () => {
      await expect(
        extendInventoryHold({
          shopId: "shop_inventory_test",
          holdId: "missing_hold",
          ttlMs: 60_000,
          now: new Date("2025-01-01T00:00:00.000Z"),
        }),
      ).resolves.toEqual({ ok: false, reason: "not_found" });
    });

    it("extends an active hold", async () => {
      const shopId = "shop_inventory_test";
      const holdId = "hold_extend_active";
      const now = new Date("2025-01-01T00:00:00.000Z");
      const ttlMs = 30_000;
      const currentExpiry = new Date(now.getTime() + 5_000);
      const expectedExpiry = new Date(now.getTime() + ttlMs);

      await (prisma as unknown as {
        inventoryHold: { create: (args: unknown) => Promise<unknown> };
      }).inventoryHold.create({
        data: {
          shopId,
          holdId,
          status: "active",
          items: [],
          expiresAt: currentExpiry,
        },
      });

      await expect(
        extendInventoryHold({ shopId, holdId, ttlMs, now }),
      ).resolves.toEqual({ ok: true, status: "extended", expiresAt: expectedExpiry });
    });

    it("returns expired when hold is already expired", async () => {
      const shopId = "shop_inventory_test";
      const holdId = "hold_extend_expired";
      const now = new Date("2025-01-01T00:00:00.000Z");

      await (prisma as unknown as {
        inventoryHold: { create: (args: unknown) => Promise<unknown> };
      }).inventoryHold.create({
        data: {
          shopId,
          holdId,
          status: "active",
          items: [],
          expiresAt: new Date(now.getTime() - 1_000),
        },
      });

      await expect(
        extendInventoryHold({ shopId, holdId, ttlMs: 60_000, now }),
      ).resolves.toEqual({ ok: false, reason: "expired" });
    });

    it("returns committed when hold is committed", async () => {
      const shopId = "shop_inventory_test";
      const holdId = "hold_extend_committed";
      const now = new Date("2025-01-01T00:00:00.000Z");

      await (prisma as unknown as {
        inventoryHold: { create: (args: unknown) => Promise<unknown> };
      }).inventoryHold.create({
        data: {
          shopId,
          holdId,
          status: "committed",
          items: [],
          expiresAt: new Date(now.getTime() + 60_000),
        },
      });

      await expect(
        extendInventoryHold({ shopId, holdId, ttlMs: 60_000, now }),
      ).resolves.toEqual({ ok: false, reason: "committed" });
    });

    it("returns released when hold is released", async () => {
      const shopId = "shop_inventory_test";
      const holdId = "hold_extend_released";
      const now = new Date("2025-01-01T00:00:00.000Z");

      await (prisma as unknown as {
        inventoryHold: { create: (args: unknown) => Promise<unknown> };
      }).inventoryHold.create({
        data: {
          shopId,
          holdId,
          status: "released",
          items: [],
          expiresAt: new Date(now.getTime() + 60_000),
        },
      });

      await expect(
        extendInventoryHold({ shopId, holdId, ttlMs: 60_000, now }),
      ).resolves.toEqual({ ok: false, reason: "released" });
    });
  });
});

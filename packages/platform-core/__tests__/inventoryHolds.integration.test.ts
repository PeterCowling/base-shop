/**
 * Integration tests for inventory holds system
 *
 * Tests the complete hold lifecycle including:
 * - Hold creation with TTL
 * - Hold commit (payment success)
 * - Hold release (payment failure)
 * - Hold expiry (reaper)
 * - Concurrency and race conditions
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  createInventoryHold,
  commitInventoryHold,
  releaseInventoryHold,
  InventoryHoldInsufficientError,
  InventoryBusyError,
} from "../src/inventoryHolds";
import { releaseExpiredInventoryHolds } from "../src/inventoryHolds.reaper";
import { prisma } from "../src/db";
import type { InventoryValidationRequest } from "../src/inventoryValidation";

const TEST_SHOP = "test-shop-inventory-holds";
const TEST_SKU = "TEST-SKU-001";

describe("Inventory Holds Integration", () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.inventoryHoldItem.deleteMany({ where: { shopId: TEST_SHOP } });
    await prisma.inventoryHold.deleteMany({ where: { shopId: TEST_SHOP } });
    await prisma.inventoryItem.deleteMany({ where: { shopId: TEST_SHOP } });

    // Seed test inventory
    await prisma.inventoryItem.create({
      data: {
        shopId: TEST_SHOP,
        sku: TEST_SKU,
        productId: "test-product",
        variantKey: "color:red",
        variantAttributes: { color: "red" },
        quantity: 10,
      },
    });
  });

  afterEach(async () => {
    // Clean up
    await prisma.inventoryHoldItem.deleteMany({ where: { shopId: TEST_SHOP } });
    await prisma.inventoryHold.deleteMany({ where: { shopId: TEST_SHOP } });
    await prisma.inventoryItem.deleteMany({ where: { shopId: TEST_SHOP } });
  });

  describe("Hold Creation", () => {
    it("should create a hold and reduce available inventory", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 600,
      });

      expect(result.holdId).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);

      // Verify inventory reduced
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(7); // 10 - 3

      // Verify hold created
      const hold = await prisma.inventoryHold.findUnique({
        where: { id: result.holdId },
      });
      expect(hold?.status).toBe("active");
      expect(hold?.shopId).toBe(TEST_SHOP);

      // Verify hold items created
      const holdItems = await prisma.inventoryHoldItem.findMany({
        where: { holdId: result.holdId },
      });
      expect(holdItems).toHaveLength(1);
      expect(holdItems[0].quantity).toBe(3);
    });

    it("should reject hold when insufficient inventory", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 15 }, // More than available
      ];

      await expect(
        createInventoryHold({
          shopId: TEST_SHOP,
          requests,
          ttlSeconds: 600,
        })
      ).rejects.toThrow(InventoryHoldInsufficientError);

      // Verify inventory unchanged
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(10); // Unchanged
    });

    it("should handle multiple items in a single hold", async () => {
      // Add another variant
      await prisma.inventoryItem.create({
        data: {
          shopId: TEST_SHOP,
          sku: TEST_SKU,
          productId: "test-product",
          variantKey: "color:blue",
          variantAttributes: { color: "blue" },
          quantity: 5,
        },
      });

      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 2 },
        { sku: TEST_SKU, variantKey: "color:blue", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 600,
      });

      const holdItems = await prisma.inventoryHoldItem.findMany({
        where: { holdId: result.holdId },
      });
      expect(holdItems).toHaveLength(2);
    });
  });

  describe("Hold Commit", () => {
    it("should commit a hold (payment success)", async () => {
      // Create hold
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 600,
      });

      // Commit hold
      await commitInventoryHold({
        shopId: TEST_SHOP,
        holdId: result.holdId,
      });

      // Verify hold committed
      const hold = await prisma.inventoryHold.findUnique({
        where: { id: result.holdId },
      });
      expect(hold?.status).toBe("committed");
      expect(hold?.committedAt).toBeInstanceOf(Date);

      // Verify inventory still reduced (not restored)
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(7); // Still reduced
    });

    it("should be idempotent (multiple commits)", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 600,
      });

      // Commit multiple times
      await commitInventoryHold({ shopId: TEST_SHOP, holdId: result.holdId });
      await commitInventoryHold({ shopId: TEST_SHOP, holdId: result.holdId });
      await commitInventoryHold({ shopId: TEST_SHOP, holdId: result.holdId });

      // Should still be committed once
      const hold = await prisma.inventoryHold.findUnique({
        where: { id: result.holdId },
      });
      expect(hold?.status).toBe("committed");
    });
  });

  describe("Hold Release", () => {
    it("should release a hold and restore inventory", async () => {
      // Create hold
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 600,
      });

      // Release hold
      await releaseInventoryHold({
        shopId: TEST_SHOP,
        holdId: result.holdId,
      });

      // Verify hold released
      const hold = await prisma.inventoryHold.findUnique({
        where: { id: result.holdId },
      });
      expect(hold?.status).toBe("released");
      expect(hold?.releasedAt).toBeInstanceOf(Date);

      // Verify inventory restored
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(10); // Restored to original
    });

    it("should be idempotent (multiple releases)", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 600,
      });

      // Release multiple times
      await releaseInventoryHold({ shopId: TEST_SHOP, holdId: result.holdId });
      await releaseInventoryHold({ shopId: TEST_SHOP, holdId: result.holdId });
      await releaseInventoryHold({ shopId: TEST_SHOP, holdId: result.holdId });

      // Inventory should only be restored once
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(10); // Not over-restored
    });
  });

  describe("Hold Expiry (Reaper)", () => {
    it("should expire holds past TTL and restore inventory", async () => {
      // Create hold with short TTL
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 1, // 1 second
        reapLimit: 0, // Don't reap on create
      });

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Run reaper
      await prisma.$transaction(async (tx: any) => {
        await releaseExpiredInventoryHolds({
          shopId: TEST_SHOP,
          tx,
          now: new Date(),
          limit: 100,
        });
      });

      // Verify hold expired
      const hold = await prisma.inventoryHold.findUnique({
        where: { id: result.holdId },
      });
      expect(hold?.status).toBe("expired");
      expect(hold?.expiredAt).toBeInstanceOf(Date);

      // Verify inventory restored
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(10); // Restored
    });

    it("should not expire holds that haven't reached TTL", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 3 },
      ];

      const result = await createInventoryHold({
        shopId: TEST_SHOP,
        requests,
        ttlSeconds: 3600, // 1 hour
        reapLimit: 0,
      });

      // Run reaper immediately
      await prisma.$transaction(async (tx: any) => {
        await releaseExpiredInventoryHolds({
          shopId: TEST_SHOP,
          tx,
          now: new Date(),
          limit: 100,
        });
      });

      // Verify hold still active
      const hold = await prisma.inventoryHold.findUnique({
        where: { id: result.holdId },
      });
      expect(hold?.status).toBe("active");
    });

    it("should process multiple expired holds", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 1 },
      ];

      // Create 5 holds
      const holdIds = [];
      for (let i = 0; i < 5; i++) {
        const result = await createInventoryHold({
          shopId: TEST_SHOP,
          requests,
          ttlSeconds: 1,
          reapLimit: 0,
        });
        holdIds.push(result.holdId);
      }

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Run reaper
      await prisma.$transaction(async (tx: any) => {
        await releaseExpiredInventoryHolds({
          shopId: TEST_SHOP,
          tx,
          now: new Date(),
          limit: 100,
        });
      });

      // Verify all expired
      const holds = await prisma.inventoryHold.findMany({
        where: { id: { in: holdIds } },
      });
      expect(holds.every((h) => h.status === "expired")).toBe(true);

      // Verify inventory fully restored
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(10); // All 5 items restored
    });
  });

  describe("Concurrency", () => {
    it("should handle concurrent hold creations", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 2 },
      ];

      // Create 5 holds concurrently
      const promises = Array(5)
        .fill(null)
        .map(() =>
          createInventoryHold({
            shopId: TEST_SHOP,
            requests,
            ttlSeconds: 600,
            reapLimit: 0,
          })
        );

      const results = await Promise.all(promises);

      // All should succeed
      expect(results).toHaveLength(5);
      expect(results.every((r) => r.holdId)).toBe(true);

      // Verify inventory correctly reduced
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(0); // 10 - (5 * 2) = 0
    });

    it("should prevent overselling under concurrent load", async () => {
      const requests: InventoryValidationRequest[] = [
        { sku: TEST_SKU, variantKey: "color:red", quantity: 6 }, // More than half
      ];

      // Try to create 2 holds concurrently (both requesting 6, but only 10 available)
      const promises = [
        createInventoryHold({
          shopId: TEST_SHOP,
          requests,
          ttlSeconds: 600,
          reapLimit: 0,
        }),
        createInventoryHold({
          shopId: TEST_SHOP,
          requests,
          ttlSeconds: 600,
          reapLimit: 0,
        }),
      ];

      const results = await Promise.allSettled(promises);

      // One should succeed, one should fail
      const succeeded = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      // Verify no overselling
      const item = await prisma.inventoryItem.findUnique({
        where: {
          shopId_sku_variantKey: {
            shopId: TEST_SHOP,
            sku: TEST_SKU,
            variantKey: "color:red",
          },
        },
      });
      expect(item?.quantity).toBe(4); // 10 - 6 = 4 (not negative)
    });
  });
});

/** @jest-environment node */
/**
 * Database Integration Tests
 *
 * These tests make real calls to a PostgreSQL database via Prisma to verify:
 * 1. The database schema is correctly defined
 * 2. CRUD operations work as expected
 * 3. Unique constraints and relations work correctly
 * 4. Transaction behavior is correct
 *
 * REQUIREMENTS:
 * - Set DATABASE_URL environment variable to a test database
 * - The test database should have the Prisma schema applied
 * - These tests are skipped unless DATABASE_URL is configured and NODE_ENV != 'test'
 *
 * SETUP:
 *   # Create test database and apply schema
 *   createdb base_shop_test
 *   DATABASE_URL="postgresql://localhost/base_shop_test" pnpm prisma:migrate
 *
 * RUN:
 *   DATABASE_URL="postgresql://localhost/base_shop_test" NODE_ENV=integration \
 *     pnpm --filter @acme/platform-core test -- db.integration
 *
 * NOTE: Tests use unique prefixes and clean up after themselves to avoid
 * conflicts with other data. However, using a dedicated test database is
 * strongly recommended.
 */

import type { PrismaClient } from "@prisma/client";

// Check if we should run integration tests
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;
const shouldRunIntegration = Boolean(DATABASE_URL) && NODE_ENV !== "test";

// Skip entire suite if not configured for integration
const describeIntegration = shouldRunIntegration ? describe : describe.skip;

describeIntegration("Database integration", () => {
  let prisma: PrismaClient;
  const testPrefix = `test_${Date.now()}_`;
  const createdShopIds: string[] = [];
  const createdOrderIds: string[] = [];
  const createdProfileIds: string[] = [];

  beforeAll(async () => {
    // Dynamically import to get the real Prisma client
    jest.resetModules();
    const { loadPrismaClient } = await import("../db");
    const PrismaClientConstructor = loadPrismaClient();

    if (!PrismaClientConstructor) {
      throw new Error("Failed to load PrismaClient - ensure @prisma/client is installed");
    }

    prisma = new PrismaClientConstructor({
      datasources: { db: { url: DATABASE_URL } },
    });
  });

  afterEach(async () => {
    // Clean up created records in reverse dependency order
    if (createdOrderIds.length > 0) {
      await prisma.rentalOrder.deleteMany({
        where: { id: { in: createdOrderIds } },
      });
      createdOrderIds.length = 0;
    }

    if (createdProfileIds.length > 0) {
      await prisma.customerProfile.deleteMany({
        where: { customerId: { in: createdProfileIds } },
      });
      createdProfileIds.length = 0;
    }

    if (createdShopIds.length > 0) {
      // Pages and sections are cascade deleted with shops
      await prisma.shop.deleteMany({
        where: { id: { in: createdShopIds } },
      });
      createdShopIds.length = 0;
    }
  });

  afterAll(async () => {
    // Final cleanup
    try {
      await prisma.rentalOrder.deleteMany({
        where: { shop: { startsWith: testPrefix } },
      });
      await prisma.shop.deleteMany({
        where: { id: { startsWith: testPrefix } },
      });
      await prisma.customerProfile.deleteMany({
        where: { customerId: { startsWith: testPrefix } },
      });
    } catch {
      // Ignore cleanup errors
    }

    await prisma.$disconnect();
  });

  describe("Shop CRUD", () => {
    it("creates and retrieves a shop", async () => {
      const shopId = `${testPrefix}shop_crud`;
      createdShopIds.push(shopId);

      const created = await prisma.shop.create({
        data: {
          id: shopId,
          data: { name: "Test Shop", currency: "USD" },
        },
      });

      expect(created.id).toBe(shopId);
      expect(created.data).toEqual({ name: "Test Shop", currency: "USD" });

      const retrieved = await prisma.shop.findUnique({
        where: { id: shopId },
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(shopId);
    });

    it("updates shop data", async () => {
      const shopId = `${testPrefix}shop_update`;
      createdShopIds.push(shopId);

      await prisma.shop.create({
        data: { id: shopId, data: { name: "Original" } },
      });

      const updated = await prisma.shop.update({
        where: { id: shopId },
        data: { data: { name: "Updated", newField: true } },
      });

      expect(updated.data).toEqual({ name: "Updated", newField: true });
    });

    it("deletes a shop", async () => {
      const shopId = `${testPrefix}shop_delete`;

      await prisma.shop.create({
        data: { id: shopId, data: {} },
      });

      await prisma.shop.delete({ where: { id: shopId } });

      const deleted = await prisma.shop.findUnique({
        where: { id: shopId },
      });
      expect(deleted).toBeNull();
    });
  });

  describe("RentalOrder CRUD", () => {
    it("creates and retrieves an order", async () => {
      const orderId = `${testPrefix}order_crud`;
      const shop = `${testPrefix}shop_order`;
      createdOrderIds.push(orderId);

      const created = await prisma.rentalOrder.create({
        data: {
          id: orderId,
          shop,
          sessionId: "session_1",
          deposit: 5000,
          startedAt: new Date().toISOString(),
          status: "pending",
          currency: "USD",
        },
      });

      expect(created.id).toBe(orderId);
      expect(created.deposit).toBe(5000);
      expect(created.status).toBe("pending");

      const retrieved = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.sessionId).toBe("session_1");
    });

    it("enforces unique shop+sessionId constraint", async () => {
      const shop = `${testPrefix}shop_unique`;
      const sessionId = "duplicate_session";
      const orderId1 = `${testPrefix}order_unique_1`;
      const orderId2 = `${testPrefix}order_unique_2`;
      createdOrderIds.push(orderId1);

      await prisma.rentalOrder.create({
        data: {
          id: orderId1,
          shop,
          sessionId,
          deposit: 1000,
          startedAt: new Date().toISOString(),
        },
      });

      await expect(
        prisma.rentalOrder.create({
          data: {
            id: orderId2,
            shop,
            sessionId, // Same sessionId, same shop
            deposit: 2000,
            startedAt: new Date().toISOString(),
          },
        })
      ).rejects.toThrow(/unique constraint/i);
    });

    it("allows same sessionId in different shops", async () => {
      const sessionId = "shared_session";
      const orderId1 = `${testPrefix}order_shop1`;
      const orderId2 = `${testPrefix}order_shop2`;
      createdOrderIds.push(orderId1, orderId2);

      await prisma.rentalOrder.create({
        data: {
          id: orderId1,
          shop: `${testPrefix}shop_a`,
          sessionId,
          deposit: 1000,
          startedAt: new Date().toISOString(),
        },
      });

      // Should succeed - different shop
      const order2 = await prisma.rentalOrder.create({
        data: {
          id: orderId2,
          shop: `${testPrefix}shop_b`,
          sessionId,
          deposit: 2000,
          startedAt: new Date().toISOString(),
        },
      });

      expect(order2.sessionId).toBe(sessionId);
    });

    it("updates order status through lifecycle", async () => {
      const orderId = `${testPrefix}order_lifecycle`;
      createdOrderIds.push(orderId);

      await prisma.rentalOrder.create({
        data: {
          id: orderId,
          shop: `${testPrefix}shop_lifecycle`,
          sessionId: "lifecycle_session",
          deposit: 3000,
          startedAt: new Date().toISOString(),
          status: "pending",
        },
      });

      // Fulfill
      await prisma.rentalOrder.update({
        where: { id: orderId },
        data: {
          status: "fulfilled",
          fulfilledAt: new Date().toISOString(),
        },
      });

      // Ship
      await prisma.rentalOrder.update({
        where: { id: orderId },
        data: {
          status: "shipped",
          shippedAt: new Date().toISOString(),
          trackingNumber: "TRACK123",
        },
      });

      // Deliver
      await prisma.rentalOrder.update({
        where: { id: orderId },
        data: {
          status: "delivered",
          deliveredAt: new Date().toISOString(),
        },
      });

      const final = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
      });

      expect(final?.status).toBe("delivered");
      expect(final?.trackingNumber).toBe("TRACK123");
      expect(final?.fulfilledAt).toBeDefined();
      expect(final?.shippedAt).toBeDefined();
      expect(final?.deliveredAt).toBeDefined();
    });
  });

  describe("CustomerProfile CRUD", () => {
    it("creates and retrieves a customer profile", async () => {
      const customerId = `${testPrefix}customer_crud`;
      createdProfileIds.push(customerId);

      const created = await prisma.customerProfile.create({
        data: {
          customerId,
          name: "John Doe",
          email: "john@example.com",
        },
      });

      expect(created.customerId).toBe(customerId);
      expect(created.name).toBe("John Doe");
      expect(created.email).toBe("john@example.com");
    });

    it("updates customer profile", async () => {
      const customerId = `${testPrefix}customer_update`;
      createdProfileIds.push(customerId);

      await prisma.customerProfile.create({
        data: {
          customerId,
          name: "Original Name",
          email: "original@example.com",
        },
      });

      const updated = await prisma.customerProfile.update({
        where: { customerId },
        data: { name: "Updated Name" },
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.email).toBe("original@example.com"); // Unchanged
    });
  });

  describe("Transactions", () => {
    it("commits transaction on success", async () => {
      const shop = `${testPrefix}shop_tx`;
      const orderId = `${testPrefix}order_tx`;
      createdShopIds.push(shop);
      createdOrderIds.push(orderId);

      await prisma.$transaction(async (tx) => {
        await tx.shop.create({
          data: { id: shop, data: { name: "TX Shop" } },
        });

        await tx.rentalOrder.create({
          data: {
            id: orderId,
            shop,
            sessionId: "tx_session",
            deposit: 1000,
            startedAt: new Date().toISOString(),
          },
        });
      });

      // Both should exist
      const shopExists = await prisma.shop.findUnique({ where: { id: shop } });
      const orderExists = await prisma.rentalOrder.findUnique({
        where: { id: orderId },
      });

      expect(shopExists).not.toBeNull();
      expect(orderExists).not.toBeNull();
    });

    it("rolls back transaction on error", async () => {
      const shop = `${testPrefix}shop_rollback`;
      const orderId = `${testPrefix}order_rollback`;

      try {
        await prisma.$transaction(async (tx) => {
          await tx.shop.create({
            data: { id: shop, data: { name: "Rollback Shop" } },
          });

          // This will fail - invalid data
          await tx.rentalOrder.create({
            data: {
              id: orderId,
              shop,
              sessionId: "rollback_session",
              deposit: 1000,
              startedAt: new Date().toISOString(),
            },
          });

          // Force error
          throw new Error("Intentional rollback");
        });
      } catch (error) {
        expect((error as Error).message).toBe("Intentional rollback");
      }

      // Neither should exist due to rollback
      const shopExists = await prisma.shop.findUnique({ where: { id: shop } });
      expect(shopExists).toBeNull();
    });
  });

  describe("Queries", () => {
    it("filters orders by shop", async () => {
      const shop1 = `${testPrefix}shop_filter_1`;
      const shop2 = `${testPrefix}shop_filter_2`;
      const orders = [
        { id: `${testPrefix}filter_1`, shop: shop1, sessionId: "s1" },
        { id: `${testPrefix}filter_2`, shop: shop1, sessionId: "s2" },
        { id: `${testPrefix}filter_3`, shop: shop2, sessionId: "s3" },
      ];
      createdOrderIds.push(...orders.map((o) => o.id));

      await Promise.all(
        orders.map((o) =>
          prisma.rentalOrder.create({
            data: {
              ...o,
              deposit: 1000,
              startedAt: new Date().toISOString(),
            },
          })
        )
      );

      const shop1Orders = await prisma.rentalOrder.findMany({
        where: { shop: shop1 },
      });

      expect(shop1Orders).toHaveLength(2);
      expect(shop1Orders.every((o) => o.shop === shop1)).toBe(true);
    });

    it("orders results by field", async () => {
      const shop = `${testPrefix}shop_sort`;
      const orders = [
        { id: `${testPrefix}sort_a`, deposit: 3000 },
        { id: `${testPrefix}sort_b`, deposit: 1000 },
        { id: `${testPrefix}sort_c`, deposit: 2000 },
      ];
      createdOrderIds.push(...orders.map((o) => o.id));

      await Promise.all(
        orders.map((o, i) =>
          prisma.rentalOrder.create({
            data: {
              ...o,
              shop,
              sessionId: `sort_${i}`,
              startedAt: new Date().toISOString(),
            },
          })
        )
      );

      const sorted = await prisma.rentalOrder.findMany({
        where: { shop },
        orderBy: { deposit: "asc" },
      });

      expect(sorted.map((o) => o.deposit)).toEqual([1000, 2000, 3000]);
    });
  });
});

// Export check for documentation
export const integrationTestsEnabled = shouldRunIntegration;

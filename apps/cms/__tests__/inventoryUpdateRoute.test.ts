import fs from "node:fs/promises";
import path from "node:path";
import { withTempRepo } from "@acme/test-utils";

// Response.json polyfill is provided in jest.setup.ts

describe("inventory update route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("applies partial updates", async () => {
    await withTempRepo(async () => {
      process.env.SKIP_STOCK_ALERT = "1";
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
        jest.doMock("@acme/config", () => ({
          env: {
            NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!",
            CART_COOKIE_SECRET: "c",
            SESSION_SECRET: "test-session-secret-32-chars-long-string!",
          },
        }));
      const { writeInventory, readInventory } = await import(
        "@platform-core/repositories/inventory.server",
      );
      await writeInventory("test", [
        {
          sku: "a",
          productId: "p1",
          quantity: 1,
          lowStockThreshold: 2,
          variantAttributes: {},
        },
      ]);
      const route = await import(
        "../src/app/api/data/[shop]/inventory/[sku]/route",
      );
      const req = { json: async () => ({ quantity: 5, variantAttributes: {} }) } as any;
      const res = await route.PATCH(req, {
        params: Promise.resolve({ shop: "test", sku: "a" }),
      });
      expect(res.status).toBe(200);
      const items = await readInventory("test");
      expect(items).toEqual([
        {
          sku: "a",
          productId: "p1",
          quantity: 5,
          lowStockThreshold: 2,
          variantAttributes: {},
        },
      ]);
    });
  });

  it("merges concurrent updates", async () => {
    await withTempRepo(async () => {
      process.env.SKIP_STOCK_ALERT = "1";
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
        jest.doMock("@acme/config", () => ({
          env: {
            NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!",
            CART_COOKIE_SECRET: "c",
            SESSION_SECRET: "test-session-secret-32-chars-long-string!",
          },
        }));
      const { writeInventory, readInventory } = await import(
        "@platform-core/repositories/inventory.server",
      );
      await writeInventory("test", [
        { sku: "a", productId: "p1", quantity: 0, variantAttributes: {} },
      ]);
      const route = await import(
        "../src/app/api/data/[shop]/inventory/[sku]/route",
      );
      const req1 = { json: async () => ({ quantity: 5, variantAttributes: {} }) } as any;
      const req2 = {
        json: async () => ({ lowStockThreshold: 2, variantAttributes: {} }),
      } as any;
      await Promise.all([
        route.PATCH(req1, {
          params: Promise.resolve({ shop: "test", sku: "a" }),
        }),
        route.PATCH(req2, {
          params: Promise.resolve({ shop: "test", sku: "a" }),
        }),
      ]);
      const items = await readInventory("test");
      expect(items).toEqual([
        {
          sku: "a",
          productId: "p1",
          quantity: 5,
          lowStockThreshold: 2,
          variantAttributes: {},
        },
      ]);
    });
  });
});

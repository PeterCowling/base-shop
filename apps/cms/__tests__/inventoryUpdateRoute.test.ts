import fs from "node:fs/promises";
import path from "node:path";

import { jsonRequest,mockNextAuthAdmin, withTempRepo } from "@acme/test-utils";

// Response.json polyfill is provided in jest.setup.ts

describe("inventory update route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("applies partial updates", async () => {
    await withTempRepo(async () => {
      process.env.SKIP_STOCK_ALERT = "1";
      mockNextAuthAdmin();
        jest.doMock("@acme/config", () => ({
          env: {
            NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!",
            CART_COOKIE_SECRET: "c",
            SESSION_SECRET: "test-session-secret-32-chars-long-string!",
          },
        }));
      const { writeInventory, readInventory } = await import(
        "@acme/platform-core/repositories/inventory.server",
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
      const res = await route.PATCH(jsonRequest({ quantity: 5, variantAttributes: {} }), {
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
      mockNextAuthAdmin();
        jest.doMock("@acme/config", () => ({
          env: {
            NEXTAUTH_SECRET: "test-nextauth-secret-32-chars-long-string!",
            CART_COOKIE_SECRET: "c",
            SESSION_SECRET: "test-session-secret-32-chars-long-string!",
          },
        }));
      const { writeInventory, readInventory } = await import(
        "@acme/platform-core/repositories/inventory.server",
      );
      await writeInventory("test", [
        { sku: "a", productId: "p1", quantity: 0, variantAttributes: {} },
      ]);
      const route = await import(
        "../src/app/api/data/[shop]/inventory/[sku]/route",
      );
      const req1 = jsonRequest({ quantity: 5, variantAttributes: {} });
      const req2 = jsonRequest({ lowStockThreshold: 2, variantAttributes: {} });
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

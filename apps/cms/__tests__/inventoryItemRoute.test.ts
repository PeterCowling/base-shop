import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Polyfill Response.json if missing
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
}

async function withTempRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-route-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });
  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("inventory item route", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  it("applies partial updates", async () => {
    await withTempRepo(async (dir) => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@platform-core/services/stockAlert.server", () => ({
        checkAndAlert: jest.fn(),
      }));
      jest.doMock("@cms/auth/options", () => ({ authOptions: {} }));
      const file = path.join(dir, "data", "shops", "test", "inventory.json");
      await fs.writeFile(
        file,
        JSON.stringify([
          {
            sku: "a",
            productId: "a",
            quantity: 1,
            lowStockThreshold: 1,
            variantAttributes: { size: "M" },
          },
        ])
      );
      const route = await import("../src/app/api/data/[shop]/inventory/[sku]/route");
      const req = {
        json: async () => ({ variantAttributes: { size: "M" }, quantity: 2 }),
      } as any;
      const res = await route.PATCH(req, {
        params: Promise.resolve({ shop: "test", sku: "a" }),
      });
      expect(res.status).toBe(200);
      const buf = await fs.readFile(file, "utf8");
      expect(JSON.parse(buf)).toEqual([
        {
          sku: "a",
          productId: "a",
          quantity: 2,
          lowStockThreshold: 1,
          variantAttributes: { size: "M" },
        },
      ]);
    });
  });

  it("handles concurrent updates", async () => {
    await withTempRepo(async (dir) => {
      jest.doMock("next-auth", () => ({
        getServerSession: jest.fn().mockResolvedValue({ user: { role: "admin" } }),
      }));
      jest.doMock("@platform-core/services/stockAlert.server", () => ({
        checkAndAlert: jest.fn(),
      }));
      jest.doMock("@cms/auth/options", () => ({ authOptions: {} }));
      const file = path.join(dir, "data", "shops", "test", "inventory.json");
      await fs.writeFile(
        file,
        JSON.stringify([
          {
            sku: "a",
            productId: "a",
            quantity: 1,
            lowStockThreshold: 1,
            variantAttributes: { size: "M" },
          },
        ])
      );
      const route = await import("../src/app/api/data/[shop]/inventory/[sku]/route");
      const req1 = {
        json: async () => ({ variantAttributes: { size: "M" }, quantity: 3 }),
      } as any;
      const req2 = {
        json: async () => ({ variantAttributes: { size: "M" }, lowStockThreshold: 5 }),
      } as any;
      await Promise.all([
        route.PATCH(req1, { params: Promise.resolve({ shop: "test", sku: "a" }) }),
        route.PATCH(req2, { params: Promise.resolve({ shop: "test", sku: "a" }) }),
      ]);
      const buf = await fs.readFile(file, "utf8");
      expect(JSON.parse(buf)).toEqual([
        {
          sku: "a",
          productId: "a",
          quantity: 3,
          lowStockThreshold: 5,
          variantAttributes: { size: "M" },
        },
      ]);
    });
  });
});

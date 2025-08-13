import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

async function withTempRepo(cb: (dir: string) => Promise<void>): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-repo-"));
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

describe("updateInventoryItem", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("applies partial updates", async () => {
    await withTempRepo(async (dir) => {
      jest.doMock("../../services/stockAlert.server", () => ({
        checkAndAlert: jest.fn(),
      }));
      const file = path.join(dir, "data", "shops", "test", "inventory.json");
      const initial = [
        {
          sku: "a",
          productId: "a",
          quantity: 1,
          lowStockThreshold: 1,
          variantAttributes: { size: "M" },
        },
      ];
      await fs.writeFile(file, JSON.stringify(initial));
      const { updateInventoryItem, readInventory } = await import("../inventory.server");
      await updateInventoryItem("test", "a", { size: "M" }, { quantity: 2 });
      const items = await readInventory("test");
      expect(items).toEqual([
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
      jest.doMock("../../services/stockAlert.server", () => ({
        checkAndAlert: jest.fn(),
      }));
      const file = path.join(dir, "data", "shops", "test", "inventory.json");
      const initial = [
        {
          sku: "a",
          productId: "a",
          quantity: 1,
          lowStockThreshold: 1,
          variantAttributes: { size: "M" },
        },
      ];
      await fs.writeFile(file, JSON.stringify(initial));
      const { updateInventoryItem, readInventory } = await import("../inventory.server");
      await Promise.all([
        updateInventoryItem("test", "a", { size: "M" }, { quantity: 3 }),
        updateInventoryItem("test", "a", { size: "M" }, { lowStockThreshold: 5 }),
      ]);
      const items = await readInventory("test");
      expect(items).toEqual([
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

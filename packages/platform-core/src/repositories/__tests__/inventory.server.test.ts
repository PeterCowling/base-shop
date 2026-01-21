import { promises as fs } from "node:fs";
import os from "node:os";
import * as path from "node:path";

import type { InventoryItem } from "../../types/inventory";

// Hold mutable repository implementations so we can swap them per test.
let jsonRepo: any;
let prismaRepo: any;
let prismaImportCount = 0;

jest.mock("../inventory.json.server", () => ({
  get jsonInventoryRepository() {
    return jsonRepo;
  },
}));

jest.mock("../inventory.prisma.server", () => {
  prismaImportCount++;
  return {
    get prismaInventoryRepository() {
      return prismaRepo;
    },
  };
});

jest.mock("../repoResolver", () => ({
  resolveRepo: async (
    prismaDelegate: any,
    prismaModule: any,
    jsonModule: any,
    options: any,
  ) => {
    const backend = process.env[options.backendEnvVar];
    if (backend === "json") {
      return await jsonModule();
    }
    return await prismaModule();
  },
}));

function createRepo() {
  let store: InventoryItem[] = [];
  const mkKey = (sku: string, attrs: Record<string, string>) =>
    `${sku}#${Object.entries(attrs)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|")}`.replace(/#$/, "");

  return {
    read: jest.fn(async () => store),
    write: jest.fn(async (_shop: string, items: InventoryItem[]) => {
      store = items.map((i) => ({ ...i, variantAttributes: { ...i.variantAttributes } }));
    }),
    update: jest.fn(
      async (
        _shop: string,
        sku: string,
        attrs: Record<string, string>,
        mutate: (i: InventoryItem | undefined) => InventoryItem | undefined,
      ) => {
        const key = mkKey(sku, attrs);
        const idx = store.findIndex((i) => mkKey(i.sku, i.variantAttributes) === key);
        const current = idx === -1 ? undefined : store[idx];
        const updated = mutate(current);
        if (!updated) {
          if (idx !== -1) store.splice(idx, 1);
          return undefined;
        }
        const next: InventoryItem = {
          sku,
          variantAttributes: attrs,
          productId: updated.productId,
          quantity: updated.quantity,
          ...("lowStockThreshold" in updated ? { lowStockThreshold: (updated as any).lowStockThreshold } : {}),
        };
        if (idx === -1) store.push(next);
        else store[idx] = next;
        return next;
      },
    ),
    _dump: () => store,
  };
}

describe("inventory server", () => {
  let variantKey: typeof import("../inventory.server").variantKey;
  let readInventoryMap: typeof import("../inventory.server").readInventoryMap;
  let writeInventory: typeof import("../inventory.server").writeInventory;
  let updateInventoryItem: typeof import("../inventory.server").updateInventoryItem;
  let readInventory: typeof import("../inventory.server").readInventory;

  beforeEach(async () => {
    jest.resetModules();
    jsonRepo = createRepo();
    prismaRepo = createRepo();
    prismaImportCount = 0;
    process.env.INVENTORY_BACKEND = "json";
    const mod = await import("../inventory.server");
    variantKey = mod.variantKey;
    readInventoryMap = mod.readInventoryMap;
    writeInventory = mod.writeInventory;
    updateInventoryItem = mod.updateInventoryItem;
    readInventory = mod.readInventory;
  });

  afterEach(() => {
    delete process.env.INVENTORY_BACKEND;
  });

  it("sorts attributes in variantKey", () => {
    expect(variantKey("sku", { b: "2", a: "1" })).toBe("sku#a:1|b:2");
  });

  it("reads and writes inventory map", async () => {
    await writeInventory("shop", [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: { z: "9", a: "1" } },
    ]);
    expect(jsonRepo.write).toHaveBeenCalledTimes(1);
    const map = await readInventoryMap("shop");
    expect(map).toEqual({
      "a#a:1|z:9": {
        sku: "a",
        productId: "p1",
        quantity: 1,
        variantAttributes: { z: "9", a: "1" },
      },
    });
    expect(jsonRepo.read).toHaveBeenCalledTimes(1);
  });

  it("updates items successfully", async () => {
    await writeInventory("shop", [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ]);
    const result = await updateInventoryItem("shop", "a", {}, (cur) => ({
      productId: cur!.productId,
      quantity: cur!.quantity + 2,
      variantAttributes: cur!.variantAttributes,
    }));
    expect(result).toEqual({
      sku: "a",
      productId: "p1",
      quantity: 3,
      variantAttributes: {},
    });
    expect((await readInventory("shop"))[0].quantity).toBe(3);
    expect(jsonRepo.update).toHaveBeenCalledTimes(1);
  });

  it("returns undefined when updating unknown SKU", async () => {
    await writeInventory("shop", [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ]);
    const result = await updateInventoryItem("shop", "b", {}, (cur) => {
      if (!cur) return undefined;
      return {
        productId: cur.productId,
        quantity: cur.quantity + 1,
        variantAttributes: cur.variantAttributes,
      } as any;
    });
    expect(result).toBeUndefined();
    expect(await readInventory("shop")).toEqual([
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ]);
  });

  it("ignores removal of unknown SKU", async () => {
    await writeInventory("shop", [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ]);
    const result = await updateInventoryItem("shop", "b", {}, () => undefined);
    expect(result).toBeUndefined();
    expect((await readInventory("shop"))).toHaveLength(1);
  });

  it("prevents updates when stock is insufficient", async () => {
    await writeInventory("shop", [
      { sku: "a", productId: "p1", quantity: 1, variantAttributes: {} },
    ]);
    const result = await updateInventoryItem("shop", "a", {}, (cur) => {
      const nextQty = (cur?.quantity ?? 0) - 2;
      if (nextQty < 0) return undefined;
      return { productId: cur!.productId, quantity: nextQty, variantAttributes: {} } as any;
    });
    expect(result).toBeUndefined();
    expect(await readInventory("shop")).toEqual([]);
  });
});

describe("inventory repository concurrency", () => {
  let tmpDir: string;
  let origCwd: string;

  beforeEach(async () => {
    origCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-test-"));
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(origCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
    delete process.env.SKIP_STOCK_ALERT;
  });

  it(
    "handles simultaneous updates without losing changes",
    async () => {
    jest.resetModules();
    jsonRepo = jest.requireActual("../inventory.json.server").jsonInventoryRepository;
    process.env.SKIP_STOCK_ALERT = "1";
    const { writeInventory, readInventory, updateInventoryItem } = await import(
      "../inventory.server"
    );
    const shop = "demo";
    await writeInventory(shop, [
      { sku: "a", productId: "p1", quantity: 0, variantAttributes: {} },
    ]);

    await Promise.all(
      Array.from({ length: 5 }).map(() =>
        updateInventoryItem(shop, "a", {}, (current) => ({
          productId: "p1",
          quantity: (current?.quantity ?? 0) + 1,
          variantAttributes: {},
        })),
      ),
    );

    const result = await readInventory(shop);
    expect(result).toEqual([
      { sku: "a", productId: "p1", quantity: 5, variantAttributes: {} },
    ]);
    },
    20000,
  );
});


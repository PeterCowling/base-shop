import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withRepo(
  cb: (
    repo: typeof import("../src/repositories/inventory.server"),
    shop: string,
    dir: string
  ) => Promise<void>
): Promise<void> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "inv-"));
  const shopDir = path.join(dir, "data", "shops", "test");
  await fs.mkdir(shopDir, { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const repo = await import("../src/repositories/inventory.server");
  try {
    await cb(repo, "test", dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("inventory repository", () => {
  it("readInventory throws when file missing or invalid", async () => {
    await withRepo(async (repo, shop, dir) => {
      await expect(repo.readInventory(shop)).rejects.toThrow();

      await fs.writeFile(
        path.join(dir, "data", "shops", shop, "inventory.json"),
        "bad",
        "utf8"
      );

      await expect(repo.readInventory(shop)).rejects.toThrow();
    });
  });

  it("writes inventory records", async () => {
    await withRepo(async (repo, shop, dir) => {
      const items = [
        { sku: "sku-1", quantity: 2 },
        { sku: "sku-2", quantity: 0 },
      ];
      await repo.writeInventory(shop, items);
      const buf = await fs.readFile(
        path.join(dir, "data", "shops", shop, "inventory.json"),
        "utf8"
      );
      expect(JSON.parse(buf)).toEqual(items);
    });
  });
});

import { promises as fs } from "node:fs";
import * as path from "node:path";
import os from "node:os";

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
  });

  it("handles simultaneous writes without corruption", async () => {
    process.env.SKIP_STOCK_ALERT = "1";
    const { writeInventory, readInventory } = await import("../inventory.server");
    const shop = "demo";
    const sets = [
      [
        {
          sku: "a",
          productId: "p1",
          quantity: 1,
          variantAttributes: {},
        },
      ],
      [
        {
          sku: "b",
          productId: "p2",
          quantity: 2,
          variantAttributes: {},
        },
      ],
    ];

    await Promise.all(sets.map((s) => writeInventory(shop, s)));

    const result = await readInventory(shop);
    const json = JSON.stringify(result);
    expect(sets.map((s) => JSON.stringify(s))).toContain(json);
  });
});

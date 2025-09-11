import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function withTempDir(cb: (dir: string) => Promise<void>) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "return-"));
  await fs.mkdir(path.join(dir, "data"), { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  try {
    await cb(dir);
  } finally {
    process.chdir(cwd);
  }
}

describe("return logistics cache reset", () => {
  it(
    "reloads JSON after module cache reset",
    async () => {
    const firstCfg = {
      labelService: "ups",
      inStore: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: [],
      requireTags: true,
      allowWear: false,
    };
    const secondCfg = { ...firstCfg, inStore: false };

    await withTempDir(async (dir) => {
      const file = path.join(dir, "data", "return-logistics.json");
      await fs.writeFile(file, JSON.stringify(firstCfg, null, 2), "utf8");

      jest.resetModules();
      let { getReturnLogistics } = await import("../src/returnLogistics");

      const first = await getReturnLogistics();
      expect(first).toEqual(firstCfg);

      await fs.writeFile(file, JSON.stringify(secondCfg, null, 2), "utf8");
      const stillCached = await getReturnLogistics();
      expect(stillCached).toBe(first);

      jest.resetModules();
      ({ getReturnLogistics } = await import("../src/returnLogistics"));
      const reloaded = await getReturnLogistics();
      expect(reloaded).toEqual(secondCfg);
    },
    10000
  );
});
});


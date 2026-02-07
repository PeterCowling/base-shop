import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { ZodError } from "zod";

async function withTempDir(
  cb: (
    mod: typeof import("../src/returnLogistics"),
    dir: string
  ) => Promise<void>
) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "return-"));
  await fs.mkdir(path.join(dir, "data"), { recursive: true });

  const cwd = process.cwd();
  process.chdir(dir);
  jest.resetModules();

  const mod = await import("../src/returnLogistics");
  try {
    await cb(mod, dir);
  } finally {
    process.chdir(cwd);
  }
}

async function withConfig(
  config: any,
  cb: (mod: typeof import("../src/returnLogistics")) => Promise<void>
) {
  await withTempDir(async (mod, dir) => {
    await fs.writeFile(
      path.join(dir, "data", "return-logistics.json"),
      JSON.stringify(config, null, 2),
      "utf8"
    );
    await cb(mod);
  });
}

describe("return logistics config", () => {
  it("parses file once and caches result", async () => {
    const cfg = {
      labelService: "ups",
      inStore: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: [],
      requireTags: true,
      allowWear: false,
    };
    await withConfig(cfg, async ({ getReturnLogistics }) => {
      const first = await getReturnLogistics();
      const second = await getReturnLogistics();
      expect(first).toEqual(cfg);
      expect(second).toBe(first);
    });
  });

  it("rejects when file missing and does not cache failure", async () => {
    const cfg = {
      labelService: "ups",
      inStore: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: [],
      requireTags: true,
      allowWear: false,
    };
    await withTempDir(async ({ getReturnLogistics }, dir) => {
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockRejectedValueOnce(Object.assign(new Error("ENOENT"), { code: "ENOENT" }))
        .mockResolvedValueOnce(JSON.stringify(cfg));

      await expect(getReturnLogistics()).rejects.toThrow();
      expect(readFile).toHaveBeenCalledTimes(1);

      const result = await getReturnLogistics();
      expect(result).toEqual(cfg);
      expect(readFile).toHaveBeenCalledTimes(2);
      readFile.mockRestore();
    });
  });

  it("rejects invalid JSON and does not cache failure", async () => {
    const valid = {
      labelService: "ups",
      inStore: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: [],
      requireTags: true,
      allowWear: false,
    };
    const invalid = {
      labelService: 123,
      inStore: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: [],
      requireTags: true,
      allowWear: false,
    } as any;
    await withTempDir(async ({ getReturnLogistics }, dir) => {
      const readFile = jest
        .spyOn(fs, "readFile")
        .mockResolvedValueOnce(JSON.stringify(invalid))
        .mockResolvedValueOnce(JSON.stringify(valid));

      await expect(getReturnLogistics()).rejects.toThrow();
      expect(readFile).toHaveBeenCalledTimes(1);

      const result = await getReturnLogistics();
      expect(result).toEqual(valid);
      expect(readFile).toHaveBeenCalledTimes(2);
      readFile.mockRestore();
    });
  });
});

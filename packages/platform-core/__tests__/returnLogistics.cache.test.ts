/** @jest-environment node */

import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

describe("getReturnLogistics cache", () => {
  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    delete process.env.DATA_ROOT;
  });

  it("reads configuration once and caches result", async () => {
    const cfg = {
      labelService: "ups",
      inStore: true,
      dropOffProvider: "happy-returns",
      tracking: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: ["12345"],
      mobileApp: true,
      requireTags: true,
      allowWear: false,
    };

    const spy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(JSON.stringify(cfg) as any);

    const { getReturnLogistics } = await import("../src/returnLogistics");
    const first = await getReturnLogistics();
    const second = await getReturnLogistics();

    expect(first).toEqual(cfg);
    expect(second).toBe(first);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("propagates ENOENT errors", async () => {
    const err = Object.assign(new Error("missing"), { code: "ENOENT" });
    jest.spyOn(fs, "readFile").mockRejectedValue(err);
    const { getReturnLogistics } = await import("../src/returnLogistics");
    await expect(getReturnLogistics()).rejects.toBe(err);
  });

  it("throws on invalid JSON", async () => {
    jest.spyOn(fs, "readFile").mockResolvedValue("not-json" as any);
    const { getReturnLogistics } = await import("../src/returnLogistics");
    await expect(getReturnLogistics()).rejects.toBeInstanceOf(SyntaxError);
  });

  it("reloads configuration after cache reset", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "rl-cache-"));
    const dataDir = path.join(dir, "data");
    const shopsDir = path.join(dataDir, "shops");
    await fs.mkdir(shopsDir, { recursive: true });
    const file = path.join(dataDir, "return-logistics.json");

    const cfg = {
      labelService: "ups",
      inStore: true,
      dropOffProvider: "happy-returns",
      tracking: true,
      bagType: "reusable",
      returnCarrier: ["ups"],
      homePickupZipCodes: ["12345"],
      mobileApp: true,
      requireTags: true,
      allowWear: false,
    };

    await fs.writeFile(file, JSON.stringify(cfg), "utf8");
    process.env.DATA_ROOT = shopsDir;

    const spy = jest.spyOn(fs, "readFile");
    const { getReturnLogistics } = await import("../src/returnLogistics");
    const first = await getReturnLogistics();
    expect(first).toEqual(cfg);
    expect(spy).toHaveBeenCalledTimes(1);

    const updated = { ...cfg, mobileApp: false };
    await fs.writeFile(file, JSON.stringify(updated), "utf8");

    jest.resetModules();
    const { getReturnLogistics: fresh } = await import("../src/returnLogistics");
    const second = await fresh();

    expect(second).toEqual(updated);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});


import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { listShops } from "../src/app/cms/listShops";

describe("listShops", () => {
  it("throws when directory missing", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-"));
    const shopDir = path.join(dir, "data", "shops", "foo");
    await fs.mkdir(shopDir, { recursive: true });

    const spy = jest.spyOn(process, "cwd").mockReturnValue(dir);

    await expect(listShops()).resolves.toEqual(["foo"]);

    await fs.rm(shopDir, { recursive: true, force: true });
    await expect(listShops()).rejects.toThrow("Failed to list shops");

    spy.mockRestore();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("throws when data/shops is missing", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-"));
    const spy = jest.spyOn(process, "cwd").mockReturnValue(dir);

    await expect(listShops()).rejects.toThrow();

    spy.mockRestore();
    await fs.rm(dir, { recursive: true, force: true });
  });
});

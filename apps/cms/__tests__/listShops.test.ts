import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { listShops } from "../src/lib/listShops";
import { logger } from "@acme/shared-utils";

jest.mock("@acme/shared-utils", () => ({
  logger: { error: jest.fn() },
}));

describe("listShops", () => {
  it("returns empty list when no shops", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-"));
    const shopDir = path.join(dir, "data", "shops", "foo");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test creates a directory inside a controlled temp path from fs.mkdtemp
    await fs.mkdir(shopDir, { recursive: true });

    const spy = jest.spyOn(process, "cwd").mockReturnValue(dir);

    await expect(listShops()).resolves.toEqual(["foo"]);

    await fs.rm(shopDir, { recursive: true, force: true });
    await expect(listShops()).resolves.toEqual([]);

    spy.mockRestore();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns empty list when data/shops is missing", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-"));
    const spy = jest.spyOn(process, "cwd").mockReturnValue(dir);

    await expect(listShops()).resolves.toEqual([]);

    spy.mockRestore();
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("logs and rethrows when fs.readdir fails for other reasons", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "shops-"));
    const shopsDir = path.join(dir, "data", "shops");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test creates a directory inside a controlled temp path from fs.mkdtemp
    await fs.mkdir(shopsDir, { recursive: true });

    const cwdSpy = jest.spyOn(process, "cwd").mockReturnValue(dir);
    const error = Object.assign(new Error("boom"), { code: "EACCES" });
    const readSpy = jest.spyOn(fs, "readdir").mockRejectedValue(error);

    const expectedDir = shopsDir.startsWith("/private/")
      ? shopsDir.slice("/private".length)
      : shopsDir;

    await expect(listShops()).rejects.toBe(error);
    expect(logger.error).toHaveBeenCalled();

    readSpy.mockRestore();
    cwdSpy.mockRestore();
    await fs.rm(dir, { recursive: true, force: true });
  });
});

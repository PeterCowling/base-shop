import type { PathLike } from "node:fs";
import * as path from "node:path";

const fs = jest.requireActual("node:fs") as typeof import("node:fs");

describe("dataRoot", () => {
  const originalCwd = process.cwd();
  const originalEnv = process.env.DATA_ROOT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.DATA_ROOT;
    } else {
      process.env.DATA_ROOT = originalEnv;
    }
    process.chdir(originalCwd);
    jest.restoreAllMocks();
    jest.resetModules();
  });

  it("returns resolved env path when DATA_ROOT is set", async () => {
    process.env.DATA_ROOT = "/tmp/env-root";
    const { resolveDataRoot } = await import("../src/dataRoot");
    expect(resolveDataRoot()).toBe(path.resolve("/tmp/env-root"));
  });

  it("returns outermost data/shops when multiple ancestors contain it", async () => {
    jest.spyOn(process, "cwd").mockReturnValue("/repo/app/nested");
    const spy = jest
      .spyOn(fs, "existsSync")
      .mockImplementation(
        (p: PathLike) => p === "/repo/app/data/shops" || p === "/repo/data/shops"
      );
    const { resolveDataRoot } = await import("../src/dataRoot");
    spy.mockClear();
    expect(resolveDataRoot()).toBe("/repo/data/shops");
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenNthCalledWith(1, "/repo/app/nested/data/shops");
    expect(spy).toHaveBeenNthCalledWith(2, "/repo/app/data/shops");
    expect(spy).toHaveBeenNthCalledWith(3, "/repo/data/shops");
    expect(spy).toHaveBeenNthCalledWith(4, "/data/shops");
  });

  it("falls back to <cwd>/data/shops when nothing found", async () => {
    jest.spyOn(process, "cwd").mockReturnValue("/repo/app");
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    const { resolveDataRoot } = await import("../src/dataRoot");
    expect(resolveDataRoot()).toBe(path.resolve("/repo/app", "data", "shops"));
  });

  it("exports DATA_ROOT equal to resolveDataRoot()", async () => {
    const mod = await import("../src/dataRoot");
    expect(mod.DATA_ROOT).toBe(mod.resolveDataRoot());
  });
});

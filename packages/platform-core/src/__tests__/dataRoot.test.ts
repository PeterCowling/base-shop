/** @jest-environment node */

import * as path from "node:path";
import type { PathLike } from "node:fs";

describe("resolveDataRoot", () => {
  const originalEnv = process.env.DATA_ROOT;
  const originalCwd = process.cwd();

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

  it("returns resolved DATA_ROOT when env var set", async () => {
    process.env.DATA_ROOT = "/custom/path";
    const { resolveDataRoot } = await import("../dataRoot");
    expect(resolveDataRoot()).toBe(path.resolve("/custom/path"));
  });

  it("finds ancestor data/shops directory", async () => {
    jest.spyOn(process, "cwd").mockReturnValue("/a/b/c");
    jest.doMock("node:fs", () => ({
      existsSync: (p: PathLike) => p === path.join("/a/b", "data", "shops"),
    }));
    const { resolveDataRoot } = await import("../dataRoot");
    expect(resolveDataRoot()).toBe(path.join("/a/b", "data", "shops"));
  });

  it("falls back to cwd/data/shops when none found", async () => {
    jest.spyOn(process, "cwd").mockReturnValue("/a/b/c");
    jest.doMock("node:fs", () => ({ existsSync: () => false }));
    const { resolveDataRoot } = await import("../dataRoot");
    expect(resolveDataRoot()).toBe(path.resolve("/a/b/c", "data", "shops"));
  });
});


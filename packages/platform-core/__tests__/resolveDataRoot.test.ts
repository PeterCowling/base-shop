import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("resolveDataRoot", () => {
  const originalCwd = process.cwd();
  let tempDirs: string[] = [];

  afterEach(() => {
    process.chdir(originalCwd);
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs = [];
    delete process.env.DATA_ROOT;
    jest.resetModules();
  });

  it("returns path.resolve(DATA_ROOT) when env is set", async () => {
    process.env.DATA_ROOT = "./custom/data";
    const { resolveDataRoot } = await import("../src/dataRoot");
    expect(resolveDataRoot()).toBe(path.resolve("./custom/data"));
  });

  it("walks up directories to find data/shops", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "data-root-"));
    tempDirs.push(tmp);
    const target = path.join(tmp, "data", "shops");
    fs.mkdirSync(target, { recursive: true });
    const nested = path.join(tmp, "a", "b", "c");
    fs.mkdirSync(nested, { recursive: true });
    process.chdir(nested);

    const { resolveDataRoot } = await import("../src/dataRoot");
    expect(resolveDataRoot()).toBe(target);
  });

  it("falls back to <cwd>/data/shops when no folder exists", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "data-root-"));
    tempDirs.push(tmp);
    const nested = path.join(tmp, "x", "y", "z");
    fs.mkdirSync(nested, { recursive: true });
    process.chdir(nested);

    const { resolveDataRoot } = await import("../src/dataRoot");
    const expected = path.join(nested, "data", "shops");
    expect(resolveDataRoot()).toBe(expected);
  });

  it("exports DATA_ROOT equal to resolveDataRoot()", async () => {
    process.env.DATA_ROOT = "/another/custom";
    const { resolveDataRoot, DATA_ROOT } = await import("../src/dataRoot");
    expect(DATA_ROOT).toBe(resolveDataRoot());
  });
});


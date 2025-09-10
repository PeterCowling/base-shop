import * as os from "node:os";
import * as path from "node:path";

const fs = jest.requireActual("node:fs") as typeof import("node:fs");

describe("resolveDataRoot", () => {
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

  it("strips '/private' prefix from DATA_ROOT when set", async () => {
    const custom = "/private/var/test-data";
    process.env.DATA_ROOT = custom;
    const { resolveDataRoot } = await import("../src/dataRoot");
    expect(resolveDataRoot()).toBe("/var/test-data");
  });

  it("walks up directories to find the first data/shops", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "data-root-"));
    try {
      const parent = path.join(tmp, "parent");
      const shops = path.join(parent, "data", "shops");
      fs.mkdirSync(shops, { recursive: true });
      const nested = path.join(parent, "packages", "core");
      fs.mkdirSync(nested, { recursive: true });
      process.chdir(nested);
      const { resolveDataRoot } = await import("../src/dataRoot");
      expect(resolveDataRoot()).toBe(shops);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("falls back to <cwd>/data/shops when nothing found", async () => {
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(process, "cwd").mockReturnValue("/repo/app");
    const { resolveDataRoot } = await import("../src/dataRoot");
    expect(resolveDataRoot()).toBe(path.resolve("/repo/app", "data", "shops"));
  });
});


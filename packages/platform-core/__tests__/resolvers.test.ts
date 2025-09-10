import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolvePluginEntry, importByType } from "../src/plugins/resolvers";
import { logger } from "../src/utils";
import { pathToFileURL } from "node:url";

describe("plugin resolvers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("resolves entry from string exports", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plug-"));
    const dist = path.join(dir, "dist");
    await fs.mkdir(dist, { recursive: true });
    const file = path.join(dist, "index.js");
    await fs.writeFile(file, "module.exports = {};");
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ exports: "./dist/index.js" })
    );
    const res = await resolvePluginEntry(dir);
    expect(res.entryPath).toBe(file);
    expect(res.isModule).toBe(false);
  });

  it("resolves entry from object exports preferring import", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plug-"));
    const dist = path.join(dir, "dist");
    await fs.mkdir(dist, { recursive: true });
    const importFile = path.join(dist, "index.mjs");
    const defaultFile = path.join(dist, "index.js");
    const requireFile = path.join(dist, "index.cjs");
    await fs.writeFile(importFile, "export default {};");
    await fs.writeFile(defaultFile, "module.exports = {};");
    await fs.writeFile(requireFile, "module.exports = {};");
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        exports: {
          ".": {
            import: "./dist/index.mjs",
            default: "./dist/index.js",
            require: "./dist/index.cjs",
          },
        },
      })
    );
    const res = await resolvePluginEntry(dir);
    expect(res.entryPath).toBe(importFile);
    expect(res.isModule).toBe(true);
  });

  it("returns null entry when no candidates exist", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plug-"));
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ main: "./dist/missing.js" })
    );
    const res = await resolvePluginEntry(dir);
    expect(res).toEqual({ entryPath: null, isModule: false });
  });

  it("logs error on malformed package.json", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plug-"));
    await fs.writeFile(path.join(dir, "package.json"), "{ not json }");
    const err = jest.spyOn(logger, "error").mockImplementation(() => {});
    const res = await resolvePluginEntry(dir);
    expect(err).toHaveBeenCalled();
    expect(res).toEqual({ entryPath: null, isModule: false });
  });

  it("logs error when readFile throws", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plug-read-"));
    jest.spyOn(fs, "readFile").mockRejectedValue(new Error("boom"));
    const err = jest.spyOn(logger, "error").mockImplementation(() => {});
    const res = await resolvePluginEntry(dir);
    expect(err).toHaveBeenCalled();
    expect(res).toEqual({ entryPath: null, isModule: false });
  });

  it("importByType loads mjs and cjs modules", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plug-"));
    const mjs = path.join(dir, "mod.mjs");
    const cjs = path.join(dir, "mod.cjs");
    await fs.writeFile(cjs, "module.exports = { val: 'cjs' };");
    const mjsUrl = pathToFileURL(mjs).href;
    jest.doMock(
      mjsUrl,
      () => ({ __esModule: true, default: { val: "esm" } }),
      { virtual: true }
    );
    const esm = await importByType(mjs, false);
    const c = await importByType(cjs, false);
    expect(esm.default.val).toBe("esm");
    expect(c.val).toBe("cjs");
  });
});


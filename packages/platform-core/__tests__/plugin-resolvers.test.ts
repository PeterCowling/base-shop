import * as fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  exportsToCandidates,
  importByType,
  resolvePluginEntry,
} from "../src/plugins/resolvers";

const reqMock = jest.fn();
jest.mock("module", () => ({ createRequire: () => reqMock }));

describe("exportsToCandidates", () => {
  it("returns path for string exports", () => {
    const dir = "/test";
    const candidates = exportsToCandidates(dir, "./dist/index.js");
    expect(candidates).toEqual([path.resolve(dir, "./dist/index.js")]);
  });

  it("returns paths for object exports", () => {
    const dir = "/test";
    const exportsField = {
      ".": {
        import: "./dist/index.mjs",
        default: "./dist/index.js",
        require: "./dist/index.cjs",
      },
    };
    const candidates = exportsToCandidates(dir, exportsField);
    expect(candidates).toEqual([
      path.resolve(dir, "./dist/index.mjs"),
      path.resolve(dir, "./dist/index.js"),
      path.resolve(dir, "./dist/index.cjs"),
    ]);
  });

  it("returns empty array for malformed exports", () => {
    const candidates = exportsToCandidates("/test", 42 as unknown);
    expect(candidates).toEqual([]);
  });

  it("dedupes duplicate paths", () => {
    const dir = "/test";
    const exportsField = {
      ".": {
        import: "./dist/index.js",
        default: "./dist/index.js",
        require: "./dist/index.js",
      },
    };
    const candidates = exportsToCandidates(dir, exportsField);
    expect(candidates).toEqual([path.resolve(dir, "./dist/index.js")]);
  });
});

describe("resolvePluginEntry", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("picks the first existing candidate", async () => {
    const dir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "plugin-"));
    await fsPromises.mkdir(path.join(dir, "dist"));
    await fsPromises.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({
        main: "./dist/main.js",
        module: "./dist/module.js",
        exports: { ".": { import: "./dist/export.mjs" } },
      })
    );
    await fsPromises.writeFile(path.join(dir, "dist", "module.js"), "");
    await fsPromises.writeFile(path.join(dir, "dist", "export.mjs"), "");

    const result = await resolvePluginEntry(dir);
    expect(result).toEqual({
      entryPath: path.resolve(dir, "dist/module.js"),
      isModule: false,
    });
  });

  it("returns null when package.json cannot be read", async () => {
    const dir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "plugin-"));
    const result = await resolvePluginEntry(dir);
    expect(result).toEqual({ entryPath: null, isModule: false });
  });
});

describe("importByType", () => {
  afterEach(() => {
    reqMock.mockClear();
  });

  it("loads ESM modules via import", async () => {
    const esmPath = path.join(os.tmpdir(), "mod.js");
    await expect(importByType(esmPath, true)).rejects.toThrow();
    expect(reqMock).not.toHaveBeenCalled();
  });

  it("loads CommonJS modules via require", async () => {
    reqMock.mockReturnValue("cjs");
    const cjsPath = path.join(os.tmpdir(), "mod.cjs");
    const mod = await importByType(cjsPath, false);
    expect(mod).toBe("cjs");
    expect(reqMock).toHaveBeenCalledWith(cjsPath);
  });
});

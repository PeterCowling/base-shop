import { mkdtemp, writeFile } from "node:fs/promises";
import * as fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { exportsToCandidates, resolvePluginEntry, importByType } from "../resolvers";
import { logger } from "../../utils";

jest.mock("node:fs/promises", () => ({
  ...jest.requireActual("node:fs/promises"),
  readFile: jest.fn(),
}));

describe("exportsToCandidates", () => {
  const tmp = os.tmpdir();

  it("handles string exports field", () => {
    const dir = path.join(tmp, "exports-string");
    const result = exportsToCandidates(dir, "./index.js");
    expect(result).toEqual([path.resolve(dir, "./index.js")]);
  });

  it("handles '.' pointing to string", () => {
    const dir = path.join(tmp, "exports-dot-string");
    const result = exportsToCandidates(dir, { ".": "./main.js" });
    expect(result).toEqual([path.resolve(dir, "./main.js")]);
  });

  it("collects import/default/require", () => {
    const dir = path.join(tmp, "exports-object" );
    const result = exportsToCandidates(dir, { ".": { import: "./esm.js", default: "./def.js", require: "./cjs.js" } });
    expect(result).toEqual([
      path.resolve(dir, "./esm.js"),
      path.resolve(dir, "./def.js"),
      path.resolve(dir, "./cjs.js"),
    ]);
  });

  it("ignores malformed exports", () => {
    const dir = path.join(tmp, "exports-malformed");
    const bad = new Proxy({}, {
      get() {
        throw new Error("bad");
      }
    });
    const result = exportsToCandidates(dir, bad);
    expect(result).toEqual([]);
  });
});

describe("resolvePluginEntry", () => {
  it("returns null when no candidate files exist", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-no-entry-"));
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ type: "module", main: "missing.js" }));
    const result = await resolvePluginEntry(dir);
    expect(result).toEqual({ entryPath: null, isModule: true });
  });

  it("logs error when package.json missing", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-missing-pkg-"));
    const spy = jest.spyOn(logger, "error").mockImplementation();
    const result = await resolvePluginEntry(dir);
    expect(result).toEqual({ entryPath: null, isModule: false });
    expect(spy).toHaveBeenCalled();
  });

  it("logs error when package.json invalid", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-invalid-pkg-"));
    await writeFile(path.join(dir, "package.json"), "{invalid json");
    const spy = jest.spyOn(logger, "error").mockImplementation();
    const result = await resolvePluginEntry(dir);
    expect(result).toEqual({ entryPath: null, isModule: false });
    expect(spy).toHaveBeenCalled();
  });

  it("logs error when readFile throws", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-readfile-error-"));
    (fs.readFile as jest.Mock).mockRejectedValue(new Error("boom"));
    const logSpy = jest.spyOn(logger, "error").mockImplementation();
    const result = await resolvePluginEntry(dir);
    expect(result).toEqual({ entryPath: null, isModule: false });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});

describe("importByType", () => {
  it.skip("imports ESM modules", async () => {
    const esmPath = require.resolve("ulid");
    const mod = await importByType(esmPath, true);
    expect(typeof mod.ulid).toBe("function");
  });

  it("requires CommonJS modules", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-cjs-"));
    const cjsPath = path.join(dir, "cjs.cjs");
    await writeFile(cjsPath, "module.exports = { value: 2 };");
    const mod = await importByType(cjsPath, false);
    expect(mod.value).toBe(2);
  });
});


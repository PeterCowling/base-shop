import { mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "module";
import { loadPlugin, initPlugins } from "../plugins";
import { logger } from "../utils";

const req = createRequire(__filename);
const zodPath = req.resolve("zod");
const ZOD_IMPORT = `const { z } = require('${zodPath}');`;

describe("plugin loader", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete (globalThis as any).mergedConfig;
    delete (globalThis as any).initCalled;
  });

  it("returns undefined when plugin entry is missing", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-missing-"));
    await writeFile(path.join(dir, "package.json"), JSON.stringify({ name: "missing" }));
    const errSpy = jest.spyOn(logger, "error").mockImplementation();

    const result = await loadPlugin(dir);

    expect(result).toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith(
      "No compiled plugin entry found. Ensure plugin is built before runtime.",
      { plugin: dir }
    );
  });

  it("returns undefined when module lacks default export", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-nodefault-"));
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "nodefault", main: "index.js" })
    );
    await writeFile(path.join(dir, "index.js"), "module.exports = { notPlugin: true };\n");
    const errSpy = jest.spyOn(logger, "error").mockImplementation();

    const result = await loadPlugin(dir);

    expect(result).toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith(
      "Plugin module did not export a default Plugin",
      expect.objectContaining({ plugin: dir })
    );
  });

  it("skips plugin when configSchema validation fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "plugin-root-"));
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const dir = await mkdtemp(path.join(root, "plugin-badcfg-"));
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "badcfg", main: "index.js" })
    );
    await writeFile(
      path.join(dir, "index.js"),
      `${ZOD_IMPORT}\nmodule.exports = {\n  default: {\n    id: 'bad',\n    name: 'Bad',\n    configSchema: z.object({ foo: z.string() }),\n    init: () => { globalThis.initCalled = true; }\n  }\n};\n`
    );
    const errSpy = jest.spyOn(logger, "error").mockImplementation();

    const manager = await initPlugins({ plugins: [dir], directories: [] });

    expect(manager.listPlugins()).toHaveLength(0);
    expect((globalThis as any).initCalled).toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith(
      "Invalid config for plugin",
      expect.objectContaining({ plugin: "bad" })
    );
  });

  it("merges defaultConfig with provided config", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "plugin-root-"));
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const dir = await mkdtemp(path.join(root, "plugin-merge-"));
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "merge", main: "index.js" })
    );
    await writeFile(
      path.join(dir, "index.js"),
      `${ZOD_IMPORT}\nmodule.exports = {\n  default: {\n    id: 'merge',\n    name: 'Merge',\n    defaultConfig: { a: 1, b: 2 },\n    configSchema: z.object({ a: z.number(), b: z.number(), c: z.number() }),\n    init: (cfg) => { globalThis.mergedConfig = cfg; }\n  }\n};\n`
    );

    await initPlugins({
      plugins: [dir],
      directories: [],
      config: { merge: { b: 3, c: 4 } },
    });

    expect((globalThis as any).mergedConfig).toEqual({ a: 1, b: 3, c: 4 });
  });
});


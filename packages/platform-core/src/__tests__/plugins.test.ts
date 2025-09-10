import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createRequire } from "module";
import { loadPlugin, initPlugins, loadPlugins } from "../plugins";
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

  it("logs error when plugin import fails", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "plugin-throws-"));
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "throws", main: "index.js" })
    );
    await writeFile(path.join(dir, "index.js"), "throw new Error('boom');\n");
    const errSpy = jest.spyOn(logger, "error").mockImplementation();

    const result = await loadPlugin(dir);

    expect(result).toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith(
      "Failed to import plugin entry",
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

  it("warns and continues when reading a directory fails", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "plugin-root-"));
    jest.spyOn(process, "cwd").mockReturnValue(root);
    await mkdir(path.join(root, "packages", "plugins"), { recursive: true });

    const goodSearch = await mkdtemp(path.join(root, "plugins-search-"));
    const pluginDir = await mkdtemp(path.join(goodSearch, "plugin-"));
    await writeFile(
      path.join(pluginDir, "package.json"),
      JSON.stringify({ name: "good", main: "index.js" })
    );
    await writeFile(
      path.join(pluginDir, "index.js"),
      "module.exports = { default: { id: 'good' } };\n"
    );

    const badSearch = path.join(root, "missing-dir");
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation();

    const loaded = await loadPlugins({ directories: [badSearch, goodSearch] });

    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("good");
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to read plugins directory",
      expect.objectContaining({ directory: badSearch })
    );
  });

  it("registers payments, shipping, and widgets on init", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "plugin-root-"));
    jest.spyOn(process, "cwd").mockReturnValue(root);
    await mkdir(path.join(root, "packages", "plugins"), { recursive: true });
    const dir = await mkdtemp(path.join(root, "plugin-init-"));
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "init", main: "index.js" })
    );
    await writeFile(
      path.join(dir, "index.js"),
      "module.exports = { default: { id: 'init', registerPayments: (r) => r.add('pay', { processPayment: () => {} }), registerShipping: (r) => r.add('ship', { calculateShipping: () => {} }), registerWidgets: (r) => r.add('widget', () => null) } };\n"
    );

    const manager = await initPlugins({ plugins: [dir], directories: [] });

    expect(manager.payments.get('pay')).toBeDefined();
    expect(manager.shipping.get('ship')).toBeDefined();
    expect(manager.widgets.get('widget')).toBeDefined();
  });

  it("merges defaultConfig without configSchema and runs registration hooks", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "plugin-root-"));
    jest.spyOn(process, "cwd").mockReturnValue(root);
    await mkdir(path.join(root, "packages", "plugins"), { recursive: true });
    const dir = await mkdtemp(path.join(root, "plugin-noschema-"));
    await writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "noschema", main: "index.js" })
    );
    const pluginCode = `
const callOrder = [];
module.exports = {
  default: {
    id: 'noschema',
    defaultConfig: { a: 1 },
    init: (cfg) => { globalThis.mergedConfig = cfg; callOrder.push('init'); },
    registerPayments: (r) => { callOrder.push('registerPayments'); r.add('pay', { processPayment: () => {} }); },
    registerShipping: (r) => { callOrder.push('registerShipping'); r.add('ship', { calculateShipping: () => {} }); },
    registerWidgets: (r) => { callOrder.push('registerWidgets'); r.add('widget', () => null); },
    callOrder,
  }
};
`;
    await writeFile(path.join(dir, "index.js"), pluginCode);

    const manager = await initPlugins({
      plugins: [dir],
      directories: [],
      config: { noschema: { b: 2 } },
    });

    const plugin = manager.getPlugin('noschema')!.plugin as any;
    expect(plugin.callOrder).toEqual([
      'init',
      'registerPayments',
      'registerShipping',
      'registerWidgets',
    ]);
    expect(manager.payments.get('pay')).toBeDefined();
    expect(manager.shipping.get('ship')).toBeDefined();
    expect(manager.widgets.get('widget')).toBeDefined();
    expect((globalThis as any).mergedConfig).toEqual({ a: 1, b: 2 });
  });
});


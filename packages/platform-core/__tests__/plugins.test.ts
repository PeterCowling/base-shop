import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

async function createPluginsRoot(withPlugins = true) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "plugins-"));
  if (withPlugins) {
    const base = path.join(root, "packages", "plugins");
    // valid plugin
    const validDir = path.join(base, "good");
    await fs.mkdir(validDir, { recursive: true });
    const pluginCode = `
const configSchema = {
  safeParse(value) {
    if (typeof value.enabled === 'boolean') {
      return { success: true, data: value };
    }
    return { success: false, error: new Error('invalid') };
  }
};
const callOrder = [];
const init = jest.fn(async () => {
  await Promise.resolve();
  callOrder.push('init');
});
const registerPayments = jest.fn(() => callOrder.push('registerPayments'));
const registerShipping = jest.fn(() => callOrder.push('registerShipping'));
const registerWidgets = jest.fn(() => callOrder.push('registerWidgets'));
module.exports = {
  default: {
    id: 'good',
    defaultConfig: { enabled: true },
    configSchema,
    init,
    registerPayments,
    registerShipping,
    registerWidgets,
    callOrder,
  }
};
`;
    await fs.writeFile(path.join(validDir, "index.js"), pluginCode);
    await fs.writeFile(
      path.join(validDir, "package.json"),
      JSON.stringify({ name: "good", main: "index.js" })
    );
    // missing plugin dir (no index.ts)
    const missingDir = path.join(base, "missing");
    await fs.mkdir(missingDir, { recursive: true });
    await fs.writeFile(
      path.join(missingDir, "package.json"),
      JSON.stringify({ name: "missing", main: "index.js" })
    );
    // plugin that throws
    const badDir = path.join(base, "bad");
    await fs.mkdir(badDir, { recursive: true });
    await fs.writeFile(path.join(badDir, "index.js"), "throw new Error('boom')");
    await fs.writeFile(
      path.join(badDir, "package.json"),
      JSON.stringify({ name: "bad", main: "index.js" })
    );
    // plugin exporting wrong type
    const wrongDir = path.join(base, "wrong");
    await fs.mkdir(wrongDir, { recursive: true });
    await fs.writeFile(
      path.join(wrongDir, "index.js"),
      "module.exports = { notPlugin: {} };"
    );
    await fs.writeFile(
      path.join(wrongDir, "package.json"),
      JSON.stringify({ name: "wrong", main: "index.js" })
    );
    // link root node_modules so imports resolve
    await fs.symlink(
      path.join(process.cwd(), "node_modules"),
      path.join(root, "node_modules"),
      "dir",
    ).catch(() => {});
  }
  return root;
}

describe("plugins", () => {
  afterEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns empty array when plugins directory missing", async () => {
    const root = await createPluginsRoot(false);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { logger } = await import("../src/utils");
    const warn = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const { loadPlugins } = await import("../src/plugins");
    const plugins = await loadPlugins();
    expect(plugins).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("loads valid plugins and skips missing and failing ones", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const { loadPlugins } = await import("../src/plugins");
    const plugins = await loadPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].id).toBe("good");
    error.mockRestore();
  });

  it("initPlugins awaits init before registration hooks", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { initPlugins } = await import("../src/plugins");
    const manager = await initPlugins({
      config: { good: { enabled: false } },
    });
    expect(manager.listPlugins()).toHaveLength(1);
    const plugin = manager.getPlugin("good")!.plugin as any;
    const cfg = { enabled: false };
    expect(plugin.registerPayments).toHaveBeenCalledWith(manager.payments, cfg);
    expect(plugin.registerShipping).toHaveBeenCalledWith(manager.shipping, cfg);
    expect(plugin.registerWidgets).toHaveBeenCalledWith(manager.widgets, cfg);
    expect(plugin.init).toHaveBeenCalled();
    expect(plugin.callOrder).toEqual([
      'init',
      'registerPayments',
      'registerShipping',
      'registerWidgets',
    ]);
  });

  it("skips plugins with invalid config", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { initPlugins } = await import("../src/plugins");
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const manager = await initPlugins({
      // enabled should be boolean
      config: { good: { enabled: "oops" as any } },
    });
    expect(manager.listPlugins()).toHaveLength(0);
    expect(manager.payments.list()).toHaveLength(0);
    expect(error).toHaveBeenCalledWith(
      "Invalid config for plugin",
      expect.objectContaining({ plugin: "good" })
    );
    error.mockRestore();
  });

  it("logs when plugin entry not found", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { loadPlugin } = await import("../src/plugins");
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const dir = path.join(root, "packages", "plugins", "missing");
    const plugin = await loadPlugin(dir);
    expect(plugin).toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      "No compiled plugin entry found. Ensure plugin is built before runtime.",
      expect.objectContaining({ plugin: dir })
    );
    error.mockRestore();
  });

  it("logs when plugin import fails", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { loadPlugin } = await import("../src/plugins");
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const dir = path.join(root, "packages", "plugins", "bad");
    const plugin = await loadPlugin(dir);
    expect(plugin).toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      "Failed to import plugin entry",
      expect.objectContaining({ plugin: dir })
    );
    error.mockRestore();
  });

  it("logs when plugin module exports wrong type", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { loadPlugin } = await import("../src/plugins");
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const dir = path.join(root, "packages", "plugins", "wrong");
    const plugin = await loadPlugin(dir);
    expect(plugin).toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      "Plugin module did not export a default Plugin",
      expect.objectContaining({ plugin: dir })
    );
    error.mockRestore();
  });

  it("rejects when plugin init throws", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "plugin-initfail-"));
    await fs.writeFile(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "initfail", main: "index.js" })
    );
    await fs.writeFile(
      path.join(dir, "index.js"),
      "module.exports = { default: { id: 'initfail', init: () => { throw new Error('init boom'); } } };\n"
    );
    const { initPlugins } = await import("../src/plugins");
    await expect(
      initPlugins({ plugins: [dir], directories: [] })
    ).rejects.toThrow("init boom");
  });
});


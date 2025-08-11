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
const registerPayments = jest.fn();
const registerShipping = jest.fn();
const registerWidgets = jest.fn();
export default {
  id: 'good',
  defaultConfig: { enabled: true },
  configSchema,
  registerPayments,
  registerShipping,
  registerWidgets,
};
`;
    await fs.writeFile(path.join(validDir, "index.ts"), pluginCode);
    await fs.writeFile(
      path.join(validDir, "package.json"),
      JSON.stringify({ name: "good", main: "index.ts" })
    );
    // missing plugin dir (no index.ts)
    const missingDir = path.join(base, "missing");
    await fs.mkdir(missingDir, { recursive: true });
    await fs.writeFile(
      path.join(missingDir, "package.json"),
      JSON.stringify({ name: "missing", main: "index.ts" })
    );
    // plugin that throws
    const badDir = path.join(base, "bad");
    await fs.mkdir(badDir, { recursive: true });
    await fs.writeFile(path.join(badDir, "index.ts"), "throw new Error('boom')");
    await fs.writeFile(
      path.join(badDir, "package.json"),
      JSON.stringify({ name: "bad", main: "index.ts" })
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
    const { loadPlugins } = await import("../src/plugins");
    const plugins = await loadPlugins({
      directories: [path.join(root, "packages", "plugins")],
    });
    expect(plugins).toEqual([]);
  });

  it("loads valid plugins and skips missing and failing ones", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { loadPlugins } = await import("../src/plugins");
    const plugins = await loadPlugins({
      directories: [path.join(root, "packages", "plugins")],
    });
    expect(plugins).toHaveLength(1);
    expect(plugins[0].id).toBe("good");
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("initPlugins calls all registration hooks", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { initPlugins } = await import("../src/plugins");
    const payments = { add: jest.fn() };
    const shipping = { add: jest.fn() };
    const widgets = { add: jest.fn() };
    const plugins = await initPlugins(
      {
        payments,
        shipping,
        widgets,
      },
      {
        directories: [path.join(root, "packages", "plugins")],
        config: { good: { enabled: false } },
      },
    );
    expect(plugins).toHaveLength(1);
    const plugin = plugins[0];
    const cfg = { enabled: false };
    expect(plugin.registerPayments).toHaveBeenCalledWith(payments, cfg);
    expect(plugin.registerShipping).toHaveBeenCalledWith(shipping, cfg);
    expect(plugin.registerWidgets).toHaveBeenCalledWith(widgets, cfg);
  });

  it("skips plugins with invalid config", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const { initPlugins } = await import("../src/plugins");
    const payments = { add: jest.fn() };
    const plugins = await initPlugins(
      { payments },
      {
        directories: [path.join(root, "packages", "plugins")],
        // enabled should be boolean
        config: { good: { enabled: "oops" as any } },
      },
    );
    expect(plugins).toHaveLength(0);
    expect(payments.add).not.toHaveBeenCalled();
  });
});


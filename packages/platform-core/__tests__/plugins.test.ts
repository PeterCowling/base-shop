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
const registerPayments = jest.fn();
const registerShipping = jest.fn();
const registerWidgets = jest.fn();
export default {
  id: 'good',
  defaultConfig: { enabled: true },
  registerPayments,
  registerShipping,
  registerWidgets,
};
`;
    await fs.writeFile(path.join(validDir, "index.ts"), pluginCode);
    // missing plugin dir (no index.ts)
    await fs.mkdir(path.join(base, "missing"), { recursive: true });
    // plugin that throws
    const badDir = path.join(base, "bad");
    await fs.mkdir(badDir, { recursive: true });
    await fs.writeFile(path.join(badDir, "index.ts"), "throw new Error('boom')");
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
    const plugins = await loadPlugins();
    expect(plugins).toEqual([]);
  });

  it("loads valid plugins and skips missing and failing ones", async () => {
    const root = await createPluginsRoot(true);
    jest.spyOn(process, "cwd").mockReturnValue(root);
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { loadPlugins } = await import("../src/plugins");
    const plugins = await loadPlugins();
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
    const plugins = await initPlugins({
      payments,
      shipping,
      widgets,
    });
    expect(plugins).toHaveLength(1);
    const plugin = plugins[0];
    const cfg = { enabled: true };
    expect(plugin.registerPayments).toHaveBeenCalledWith(payments, cfg);
    expect(plugin.registerShipping).toHaveBeenCalledWith(shipping, cfg);
    expect(plugin.registerWidgets).toHaveBeenCalledWith(widgets, cfg);
  });
});


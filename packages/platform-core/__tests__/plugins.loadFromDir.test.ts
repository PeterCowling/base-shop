import path from "node:path";

import type { Dirent } from "fs";

describe("loadPluginFromDir and loadPlugins", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns undefined and logs error when entryPath missing", async () => {
    const resolvePluginEntry = jest.fn().mockResolvedValue({ entryPath: undefined, isModule: false });
    const importByType = jest.fn();
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const { loadPlugin } = await import("../src/plugins");
    const plugin = await loadPlugin("/plugin");
    expect(plugin).toBeUndefined();
    expect(resolvePluginEntry).toHaveBeenCalledWith("/plugin");
    expect(error).toHaveBeenCalledWith(
      "No compiled plugin entry found. Ensure plugin is built before runtime.",
      expect.objectContaining({ plugin: "/plugin" })
    );
    error.mockRestore();
  });

  it("returns undefined and logs error when module lacks default export", async () => {
    const resolvePluginEntry = jest
      .fn()
      .mockResolvedValue({ entryPath: "/plugin/index.js", isModule: false });
    const importByType = jest.fn().mockResolvedValue({ notPlugin: {} });
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const { loadPlugin } = await import("../src/plugins");
    const plugin = await loadPlugin("/plugin");
    expect(plugin).toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      "Plugin module did not export a default Plugin",
      expect.objectContaining({ plugin: "/plugin", entry: "/plugin/index.js", exportedKeys: ["notPlugin"] })
    );
    error.mockRestore();
  });

  it("logs error and returns undefined when import fails", async () => {
    const resolvePluginEntry = jest
      .fn()
      .mockResolvedValue({ entryPath: "/plugin/index.js", isModule: false });
    const importByType = jest
      .fn()
      .mockRejectedValue(new Error("boom"));
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const { loadPlugin } = await import("../src/plugins");
    await expect(loadPlugin("/plugin")).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith(
      "Failed to import plugin entry",
      expect.objectContaining({ plugin: "/plugin", entry: "/plugin/index.js", err: expect.any(Error) })
    );
    error.mockRestore();
  });

  it("returns plugin when module exports default", async () => {
    const resolvePluginEntry = jest
      .fn()
      .mockResolvedValue({ entryPath: "/plugin/index.js", isModule: false });
    const pluginObj = { id: "good" } as any;
    const importByType = jest.fn().mockResolvedValue({ default: pluginObj });
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { loadPlugin } = await import("../src/plugins");
    const plugin = await loadPlugin("/plugin");
    expect(plugin).toBe(pluginObj);
  });

  it("returns plugin when module exports named plugin", async () => {
    const resolvePluginEntry = jest
      .fn()
      .mockResolvedValue({ entryPath: "/plugin/index.js", isModule: false });
    const pluginObj = { id: "named" } as any;
    const importByType = jest.fn().mockResolvedValue({ plugin: pluginObj });
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { loadPlugin } = await import("../src/plugins");
    const plugin = await loadPlugin("/plugin");
    expect(plugin).toBe(pluginObj);
  });

  it("discovers plugin directories and loads plugins", async () => {
    const resolvePluginEnvironment = jest
      .fn()
      .mockResolvedValue({ searchDirs: ["/search"], pluginDirs: ["/explicit"] });
    jest.doMock("../src/plugins/env", () => ({ resolvePluginEnvironment }));
    const dirent = (name: string, isDir: boolean): Dirent => ({
      name,
      isDirectory: () => isDir,
    } as Dirent);
    const readdir = jest
      .fn()
      .mockResolvedValue([dirent("p1", true), dirent("file.txt", false)]);
    jest.doMock("fs/promises", () => ({ readdir }));
    const resolvePluginEntry = jest
      .fn()
      .mockImplementation(async (dir: string) => ({ entryPath: path.join(dir, "index.js"), isModule: false }));
    const importByType = jest
      .fn()
      .mockImplementation(async (entry: string) => ({ default: { id: path.basename(path.dirname(entry)) } }));
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { loadPlugins } = await import("../src/plugins");
    const plugins = await loadPlugins();
    expect(readdir).toHaveBeenCalledWith("/search", { withFileTypes: true });
    expect(plugins.map((p) => p.id).sort()).toEqual(["explicit", "p1"]);
  });

  it("logs warning when readdir fails", async () => {
    const resolvePluginEnvironment = jest
      .fn()
      .mockResolvedValue({ searchDirs: ["/search"], pluginDirs: [] });
    jest.doMock("../src/plugins/env", () => ({ resolvePluginEnvironment }));
    const readdir = jest.fn().mockRejectedValue(new Error("fail"));
    jest.doMock("fs/promises", () => ({ readdir }));
    const resolvePluginEntry = jest.fn();
    const importByType = jest.fn();
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { logger } = await import("../src/utils");
    const warn = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const { loadPlugins } = await import("../src/plugins");
    const plugins = await loadPlugins();
    expect(plugins).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      "Failed to read plugins directory",
      expect.objectContaining({ directory: "/search", err: expect.any(Error) })
    );
    warn.mockRestore();
  });

  it("initializes plugins and skips invalid config", async () => {
    const validPlugin = {
      id: "valid",
      defaultConfig: { enabled: true },
      configSchema: { safeParse: (v: any) => ({ success: true, data: v }) },
      init: jest.fn(),
      registerPayments: jest.fn(),
      registerShipping: jest.fn(),
      registerWidgets: jest.fn(),
    } as any;
    const invalidPlugin = {
      id: "invalid",
      defaultConfig: { enabled: true },
      configSchema: { safeParse: () => ({ success: false, error: new Error("bad") }) },
      init: jest.fn(),
      registerPayments: jest.fn(),
      registerShipping: jest.fn(),
      registerWidgets: jest.fn(),
    } as any;
    const resolvePluginEnvironment = jest
      .fn()
      .mockResolvedValue({ searchDirs: [], pluginDirs: ["/valid", "/invalid"] });
    jest.doMock("../src/plugins/env", () => ({ resolvePluginEnvironment }));
    const resolvePluginEntry = jest
      .fn()
      .mockImplementation(async (dir: string) => ({ entryPath: path.join(dir, "index.js"), isModule: false }));
    const importByType = jest.fn(async (entry: string) => {
      const dir = path.dirname(entry);
      if (dir.includes("invalid")) return { default: invalidPlugin };
      if (dir.includes("valid")) return { default: validPlugin };
      return {};
    });
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { logger } = await import("../src/utils");
    const error = jest.spyOn(logger, "error").mockImplementation(() => {});
    const { initPlugins } = await import("../src/plugins");
    const manager = await initPlugins({ config: { valid: { enabled: false }, invalid: {} } });
    expect(manager.listPlugins().map((p) => p.id)).toEqual(["valid"]);
    expect(validPlugin.init).toHaveBeenCalledWith({ enabled: false });
    expect(validPlugin.registerPayments).toHaveBeenCalled();
    expect(validPlugin.registerShipping).toHaveBeenCalled();
    expect(validPlugin.registerWidgets).toHaveBeenCalled();
    expect(invalidPlugin.init).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(
      "Invalid config for plugin",
      expect.objectContaining({ plugin: "invalid" })
    );
    error.mockRestore();
  });

  it("bubbles up errors thrown during plugin init", async () => {
    const throwingPlugin = { id: "bad", init: jest.fn().mockRejectedValue(new Error("kaput")) } as any;
    const resolvePluginEnvironment = jest
      .fn()
      .mockResolvedValue({ searchDirs: [], pluginDirs: ["/bad"] });
    jest.doMock("../src/plugins/env", () => ({ resolvePluginEnvironment }));
    const resolvePluginEntry = jest
      .fn()
      .mockResolvedValue({ entryPath: "/bad/index.js", isModule: false });
    const importByType = jest.fn().mockResolvedValue({ default: throwingPlugin });
    jest.doMock("../src/plugins/resolvers", () => ({ resolvePluginEntry, importByType }));
    const { initPlugins } = await import("../src/plugins");
    await expect(initPlugins()).rejects.toThrow("kaput");
  });
});


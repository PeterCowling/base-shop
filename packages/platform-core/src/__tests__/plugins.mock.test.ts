import { readdir } from "fs/promises";
import { resolvePluginEnvironment } from "../plugins/env";
import { resolvePluginEntry, importByType } from "../plugins/resolvers";
import { logger } from "../utils";
import { z } from "zod";

jest.mock("fs/promises", () => ({ readdir: jest.fn() }));
jest.mock("../plugins/env", () => ({ resolvePluginEnvironment: jest.fn() }));
jest.mock("../plugins/resolvers", () => ({
  resolvePluginEntry: jest.fn(),
  importByType: jest.fn(),
}));

describe("loadPluginFromDir behavior", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("returns undefined and logs when entryPath missing", async () => {
    (resolvePluginEntry as jest.Mock).mockResolvedValue({ entryPath: undefined, isModule: false });
    const errSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
    const { loadPlugin } = await import("../plugins");
    const result = await loadPlugin("/p1");
    expect(result).toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith(
      "No compiled plugin entry found. Ensure plugin is built before runtime.",
      { plugin: "/p1" }
    );
  });

  test("returns undefined and logs when module lacks plugin export", async () => {
    (resolvePluginEntry as jest.Mock).mockResolvedValue({ entryPath: "/p1/index.js", isModule: true });
    (importByType as jest.Mock).mockResolvedValue({ not: "plugin" });
    const errSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
    const { loadPlugin } = await import("../plugins");
    const result = await loadPlugin("/p1");
    expect(result).toBeUndefined();
    expect(errSpy).toHaveBeenCalledWith(
      "Plugin module did not export a default Plugin",
      expect.objectContaining({ plugin: "/p1", entry: "/p1/index.js" })
    );
  });

  test("returns plugin when module exports default", async () => {
    const plugin = { id: "ok" } as any;
    (resolvePluginEntry as jest.Mock).mockResolvedValue({ entryPath: "/p1/index.js", isModule: true });
    (importByType as jest.Mock).mockResolvedValue({ default: plugin });
    const { loadPlugin } = await import("../plugins");
    const result = await loadPlugin("/p1");
    expect(result).toBe(plugin);
  });
});

describe("loadPlugins directory discovery", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("discovers plugins and warns on read errors", async () => {
    (resolvePluginEnvironment as jest.Mock).mockResolvedValue({
      searchDirs: ["/root", "/bad"],
      pluginDirs: ["/explicit"],
    });
    (readdir as jest.Mock).mockImplementation(async (dir: string) => {
      if (dir === "/root") {
        return [
          { isDirectory: () => true, name: "a" },
          { isDirectory: () => true, name: "b" },
          { isDirectory: () => false, name: "file" },
        ];
      }
      throw new Error("fail");
    });
    (resolvePluginEntry as jest.Mock).mockImplementation(async (dir: string) => ({
      entryPath: `${dir}/index.js`,
      isModule: true,
    }));
    const pluginMap: Record<string, any> = {
      "/explicit/index.js": { id: "explicit" },
      "/root/a/index.js": { id: "a" },
      "/root/b/index.js": { id: "b" },
    };
    (importByType as jest.Mock).mockImplementation(async (entry: string) => ({
      default: pluginMap[entry],
    }));
    const warnSpy = jest.spyOn(logger, "warn").mockImplementation(() => {});
    const { loadPlugins } = await import("../plugins");
    const plugins = await loadPlugins();
    expect(plugins.map(p => p.id).sort()).toEqual(["a", "b", "explicit"]);
    expect(resolvePluginEntry).toHaveBeenCalledWith("/explicit");
    expect(resolvePluginEntry).toHaveBeenCalledWith("/root/a");
    expect(resolvePluginEntry).toHaveBeenCalledWith("/root/b");
    expect(warnSpy).toHaveBeenCalledWith(
      "Failed to read plugins directory",
      expect.objectContaining({ directory: "/bad" })
    );
  });
});

describe("initPlugins config handling", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("invalid config logs error and valid plugin initializes", async () => {
    const good = {
      id: "good",
      name: "Good",
      configSchema: z.object({ foo: z.string() }),
      init: jest.fn(),
      registerPayments: jest.fn(),
      registerShipping: jest.fn(),
      registerWidgets: jest.fn(),
    };
    const bad = {
      id: "bad",
      name: "Bad",
      configSchema: z.object({ foo: z.string() }),
      init: jest.fn(),
      registerPayments: jest.fn(),
      registerShipping: jest.fn(),
      registerWidgets: jest.fn(),
    };
    const module = await import("../plugins");
    const loadSpy = jest
      .spyOn(module, "loadPlugins")
      .mockResolvedValue([good as any, bad as any]);
    const errSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
    const manager = await module.initPlugins({
      config: { good: { foo: "ok" }, bad: { foo: 123 } },
    });
    expect(good.init).toHaveBeenCalledWith({ foo: "ok" });
    expect(good.registerPayments).toHaveBeenCalled();
    expect(good.registerShipping).toHaveBeenCalled();
    expect(good.registerWidgets).toHaveBeenCalled();
    expect(manager.listPlugins()).toEqual([good]);
    expect(bad.init).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalledWith(
      "Invalid config for plugin",
      expect.objectContaining({ plugin: "bad" })
    );
    loadSpy.mockRestore();
  });
});

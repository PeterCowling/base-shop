import { PluginManager, Registry } from "../src/plugins/PluginManager";

describe("MapRegistry", () => {
  it("adds and retrieves items", () => {
    const registry = new Registry<number>();
    registry.add("one", 1);
    expect(registry.get("one")).toBe(1);
    expect(registry.get("missing")).toBeUndefined();
  });

  it("lists all registered items", () => {
    const registry = new Registry<string>();
    registry.add("a", "alpha");
    registry.add("b", "beta");
    expect(registry.list()).toEqual([
      { id: "a", value: "alpha" },
      { id: "b", value: "beta" },
    ]);
  });
});

describe("PluginManager", () => {
  it("registers a plugin via addPlugin and retrieves it with getPlugin", () => {
    const manager = new PluginManager();
    const plugin = { id: "test" } as any;
    manager.addPlugin(plugin);
    expect(manager.getPlugin("test")).toEqual({
      id: "test",
      name: undefined,
      description: undefined,
      plugin,
    });
  });

  it("returns all plugins via listPlugins", () => {
    const manager = new PluginManager();
    const pluginA = { id: "a" } as any;
    const pluginB = { id: "b" } as any;
    manager.addPlugin(pluginA);
    manager.addPlugin(pluginB);
    expect(manager.listPlugins()).toEqual([
      { id: "a", name: undefined, description: undefined, plugin: pluginA },
      { id: "b", name: undefined, description: undefined, plugin: pluginB },
    ]);
  });
});

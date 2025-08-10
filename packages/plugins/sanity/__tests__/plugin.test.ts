import plugin from "../index";

describe("sanity plugin", () => {
  it("exposes id and default config", () => {
    expect(plugin.id).toBe("sanity");
    expect(plugin.defaultConfig).toHaveProperty("projectId");
    expect(plugin.defaultConfig).toHaveProperty("dataset");
    expect(plugin.defaultConfig).toHaveProperty("token");
  });

  it("registers a blog widget", () => {
    const add = jest.fn();
    plugin.registerWidgets?.({ add } as any);
    expect(add).toHaveBeenCalledWith("sanity-blog", {});
  });
});

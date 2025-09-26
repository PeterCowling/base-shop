describe("plugins index re-exports", () => {
  it("exposes PluginManager and loader APIs", async () => {
    const mod = await import("../index");
    expect(mod).toHaveProperty("PluginManager");
    expect(mod).toHaveProperty("loadPlugins");
    expect(mod).toHaveProperty("initPlugins");
  });
});

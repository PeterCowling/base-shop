import sveltePlugin from "../index";

describe("sveltePlugin", () => {
  it("returns plugin object with name and setup logs", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const plugin = sveltePlugin();
    expect(plugin).toHaveProperty("name", "svelte-plugin");
    expect(typeof plugin.setup).toBe("function");

    plugin.setup();
    expect(logSpy).toHaveBeenCalledWith("Svelte plugin loaded");

    logSpy.mockRestore();
  });
});

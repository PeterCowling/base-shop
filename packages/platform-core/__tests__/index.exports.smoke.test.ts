import * as root from "../src/index";

describe("platform-core exports (smoke)", () => {
  it("exposes core contexts and profile module", () => {
    expect(typeof (root as any).useTheme).toBe("function");
    expect(typeof (root as any).ThemeProvider).toBe("function");
    expect(typeof (root as any).useLayout).toBe("function");
    expect(typeof (root as any).LayoutProvider).toBe("function");
    // profile is re-exported; presence is enough for coverage of root exports
    expect(root).toHaveProperty("getCustomerProfile", (root as any).getCustomerProfile);
  });
});

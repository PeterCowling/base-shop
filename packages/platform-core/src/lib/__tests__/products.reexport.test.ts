describe("lib/products re-exports", () => {
  it("exposes getProductBySlug and getProductById", async () => {
    const mod = await import("../products");
    expect(typeof mod.getProductBySlug).toBe("function");
    expect(typeof mod.getProductById).toBe("function");
  });
});


describe("customerProfiles re-export", () => {
  it("re-exports underlying module", async () => {
    const mod = await import("../index");
    // The underlying module exports functions; ensure at least one exists.
    // We assert the export shape rather than call to avoid coupling to impl.
    expect(Object.keys(mod).length).toBeGreaterThan(0);
  });
});


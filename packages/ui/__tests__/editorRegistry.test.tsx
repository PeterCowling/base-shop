import editorRegistry from "../src/components/cms/page-builder/editorRegistry";

describe("editorRegistry", () => {
  it("exposes lazy editor components", () => {
    const ImageEditor = editorRegistry.Image;
    expect(ImageEditor).toBeDefined();
    // React lazy components have a special $$typeof symbol
    expect((ImageEditor as any).$$typeof).toBe(Symbol.for("react.lazy"));
  });
});


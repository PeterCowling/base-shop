import { schema } from "@cms/app/cms/blog/posts/schema";

jest.mock("@ui", () => ({ Button: () => null }));
jest.mock("@portabletext/editor", () => ({ defineSchema: (x: any) => x }));

describe("schema", () => {
  it("includes productReference block", () => {
    const block = (schema.blockObjects as any[]).find(
      (b) => b.name === "productReference",
    );
    expect(block).toBeTruthy();
    expect(block.fields).toEqual([{ name: "sku", type: "string" }]);
  });
});

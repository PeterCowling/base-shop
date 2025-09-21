import { findById } from "../findById";

describe("findById", () => {
  const tree: any[] = [
    { id: "a", type: "Section", children: [
      { id: "b", type: "Box" },
      { id: "c", type: "Section", children: [{ id: "d", type: "Text" }] },
    ]},
  ];

  it("finds at root and nested levels", () => {
    expect(findById(tree as any, "a")?.id).toBe("a");
    expect(findById(tree as any, "b")?.id).toBe("b");
    expect(findById(tree as any, "d")?.id).toBe("d");
  });

  it("returns null when missing", () => {
    expect(findById(tree as any, "z")).toBeNull();
  });
});


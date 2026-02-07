import { computeDiffSummary, replaceComponentById } from "../versions-panel/diff";

describe("versions-panel/diff", () => {
  it("computes added, removed, and modified sets", () => {
    const current = [
      { id: "root", type: "Container", children: [{ id: "a", type: "Text" }] },
    ] as any;
    const selected = [
      { id: "root", type: "Container", children: [{ id: "a", type: "Text", name: "Changed" }] },
      { id: "b", type: "Text" },
    ] as any;

    const diff = computeDiffSummary(current, selected)!;
    expect(diff.added).toBe(1);
    expect(diff.addedIds).toContain("b");
    expect(diff.removed).toBe(0);
    // root children changed and child "a" changed a field
    expect(diff.modified).toBe(2);
    expect(diff.modifiedList).toEqual(
      expect.arrayContaining([
        { id: "a", keys: expect.arrayContaining(["name"]) },
        { id: "root", keys: expect.arrayContaining(["children"]) },
      ])
    );
    expect(Object.keys(diff.a)).toEqual(expect.arrayContaining(["root", "a"]));
    expect(Object.keys(diff.b)).toEqual(expect.arrayContaining(["root", "a", "b"]));
  });

  it("returns null if no selection", () => {
    expect(computeDiffSummary([], null)).toBeNull();
  });

  it("replaces component by id in a tree", () => {
    const tree = [{ id: "root", type: "Container", children: [{ id: "x", type: "Text" }] }] as any;
    const next = replaceComponentById(tree as any, "x", { id: "x", type: "Image" } as any);
    expect((next[0] as any).children[0]).toEqual({ id: "x", type: "Image" });
  });
});

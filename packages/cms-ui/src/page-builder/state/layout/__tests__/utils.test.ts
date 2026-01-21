import {
  addAt,
  addComponent,
  decorateTreeForViewport,
  duplicateComponent,
  flattenTree,
  getNodeById,
  getParentOfId,
  groupIntoContainer,
  isHiddenForViewport,
  moveComponent,
  removeComponent,
  ungroupContainer,
  updateComponent,
} from "../utils";

type PC = any; // loosen typing for succinct tests

describe("layout utils", () => {
  const tree: PC[] = [
    { id: "a", type: "Section", children: [
      { id: "b", type: "Box" },
      { id: "c", type: "Section", children: [{ id: "d", type: "Text" }] },
    ]},
  ];

  it("addAt inserts at index", () => {
    expect(addAt([1,2,3] as unknown as PC[], 1, 9 as unknown as PC)).toEqual([1,9,2,3]);
  });

  it("addComponent inserts at root and nested parentId", () => {
    const rootAdded = addComponent(tree as PC[], undefined, 1, { id: "x", type: "Box" } as PC);
    expect(rootAdded.map((n: PC) => n.id)).toEqual(["a","x"]);
    const nested = addComponent(tree as PC[], "a", 1, { id: "y", type: "Box" } as PC);
    const a = nested[0];
    expect(a.children.map((n: PC) => n.id)).toEqual(["b","y","c"]);
  });

  it("removeComponent removes by id across tree", () => {
    const out = removeComponent(tree as PC[], "c");
    expect(flattenTree(out).some((n) => n.id === "c")).toBe(false);
    expect(flattenTree(out).some((n) => n.id === "d")).toBe(false);
  });

  it("updateComponent normalizes numeric fields from strings", () => {
    const start: PC[] = [{ id: "p", type: "Grid", minItems: 1, maxItems: 3 }];
    const out = updateComponent(start, "p", { minItems: "2" as any, maxItems: "bad" as any });
    const p = out[0] as PC;
    expect(p.minItems).toBe(2);
    expect(p.maxItems).toBeUndefined();
  });

  it("duplicateComponent clones node next to original with new id", () => {
    const out = duplicateComponent(tree as PC[], "b");
    const ids = (out[0] as PC).children.map((n: PC) => n.id);
    expect(ids[0]).toBe("b");
    expect(ids[1]).not.toBe("b");
  });

  it("moveComponent extracts and inserts at new spot", () => {
    const moved = moveComponent(tree as PC[], { index: 0, parentId: "a" }, { index: 1, parentId: "a" });
    const ids = (moved[0] as PC).children.map((n: PC) => n.id);
    expect(ids).toEqual(["c","b"]);
  });

  it("getNodeById and getParentOfId locate nodes", () => {
    expect((getNodeById(tree as PC[], "d") as PC)?.id).toBe("d");
    expect((getParentOfId(tree as PC[], "d") as PC)?.id).toBe("c");
  });

  it("hidden flags from editor map control isHiddenForViewport and decorator merges flags", () => {
    const editor = { a: { hidden: ["desktop"], locked: true, zIndex: 7, name: "A" } } as any;
    expect(isHiddenForViewport("a", editor, false, "desktop")).toBe(true);
    const decorated = decorateTreeForViewport(tree as PC[], editor, "desktop");
    const a = decorated[0] as PC;
    expect(a.hidden).toBe(true);
    expect(a.locked).toBe(true);
    expect(a.zIndex).toBe(7);
    expect(a.name).toBe("A");
  });

  it("groupIntoContainer wraps siblings; ungroupContainer unwraps", () => {
    const grouped = groupIntoContainer(tree as PC[], ["b","c"], "Section");
    const kids = (grouped[0] as PC).children as PC[];
    expect(kids[0].type).toBe("Section");
    expect(Array.isArray(kids[0].children)).toBe(true);
    const ungrouped = ungroupContainer(grouped as PC[], kids[0].id);
    expect((ungrouped[0] as PC).children.map((n: PC) => n.id)).toEqual(["b","c"]);
  });
});


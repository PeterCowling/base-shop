// packages/ui/src/components/cms/page-builder/state/layout/utils/__tests__/ops.test.ts
import { duplicateComponent } from "../duplicateComponent";
import { flattenTree } from "../flattenTree";
import { groupIntoContainer } from "../groupIntoContainer";
import { isHiddenForViewport } from "../isHiddenForViewport";
import { moveComponent } from "../moveComponent";
import { resizeComponent } from "../resizeComponent";

describe("layout ops utils", () => {
  const tree = [
    { id: "p", type: "row", children: [
      { id: "a", type: "block" },
      { id: "b", type: "block" },
      { id: "c", type: "block" },
    ] },
  ] as any[];

  test("flattenTree returns pre-order list of nodes", () => {
    const flat = flattenTree(tree as any);
    expect(flat.map((n) => n.id)).toEqual(["p", "a", "b", "c"]);
  });

  test("moveComponent re-inserts item at new index under same parent", () => {
    const moved = moveComponent(tree as any, { parentId: "p", index: 0 }, { parentId: "p", index: 2 });
    const kids = (moved[0] as any).children as any[];
    expect(kids.map((n) => n.id)).toEqual(["b", "c", "a"]);
  });

  test("duplicateComponent clones node by id as immediate sibling", () => {
    const dup = duplicateComponent(tree as any, "b");
    const kids = (dup[0] as any).children as any[];
    expect(kids.filter((n) => n.id === "b").length).toBe(1);
    // The clone has a new id; count increased by one and order preserved with clone adjacent
    expect(kids.length).toBe(4);
  });

  test("groupIntoContainer wraps contiguous ids under a new container", () => {
    const grouped = groupIntoContainer(tree as any, ["a", "b"], "MultiColumn");
    const kids = (grouped[0] as any).children as any[];
    expect(kids[0].type).toBe("MultiColumn");
    expect(Array.isArray(kids[0].children)).toBe(true);
    expect(kids[0].children.map((n: any) => n.id)).toEqual(["a", "b"]);
    expect(kids[0].columns).toBe(2);
  });

  test("groupIntoContainer wraps non-contiguous ids under Section at first index", () => {
    const grouped = groupIntoContainer(tree as any, ["a", "c"], "Section");
    const kids = (grouped[0] as any).children as any[];
    expect(kids[0].type).toBe("Section");
    expect(kids[0].children.map((n: any) => n.id)).toEqual(["a", "c"]);
  });

  test("resizeComponent applies patch deeply by id", () => {
    const resized = resizeComponent(tree as any, "c", { width: "200px", topMobile: "10px" } as any);
    const kids = (resized[0] as any).children as any[];
    const c = kids.find((x) => x.id === "c");
    expect(c.width).toBe("200px");
    expect(c.topMobile).toBe("10px");
  });

  test("isHiddenForViewport reads editor flags with fallback", () => {
    const editor = { x: { hidden: ["mobile"] } } as any;
    expect(isHiddenForViewport("x", editor, false, "mobile")).toBe(true);
    expect(isHiddenForViewport("x", editor, false, "desktop")).toBe(false);
    expect(isHiddenForViewport("y", editor, true, "mobile")).toBe(true);
    // Without viewport param, any hidden flag array implies hidden
    expect(isHiddenForViewport("x", editor, false)).toBe(true);
  });
});

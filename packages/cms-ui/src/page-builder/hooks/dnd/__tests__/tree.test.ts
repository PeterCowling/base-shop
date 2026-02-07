// packages/ui/src/components/cms/page-builder/hooks/dnd/__tests__/tree.test.ts
import {
  findById,
  findParentId,
  getTypeOfId,
  getVisibleComponents,
  resolveParentKind,
} from "../tree";

describe("dnd tree helpers", () => {
  const tree = [
    { id: "r1", type: "Row", children: [{ id: "a", type: "Block" }] },
    { id: "r2", type: "Row", hidden: true as any, children: [{ id: "b", type: "Block" }] },
  ] as any[];

  test("findById and findParentId traverse nested structures", () => {
    expect(findById(tree as any, "a")?.id).toBe("a");
    expect(findParentId(tree as any, "a")).toBe("r1");
    expect(findParentId(tree as any, "r1")).toBeUndefined();
  });

  test("getTypeOfId resolves component type or null", () => {
    expect(getTypeOfId(tree as any, "a")).toBe("Block");
    expect(getTypeOfId(tree as any, undefined)).toBeNull();
  });

  test("getVisibleComponents filters using isHiddenForViewport semantics", () => {
    const editor = { r2: { hidden: ["desktop"] } } as any;
    const visibleDesktop = getVisibleComponents(tree as any, editor, "desktop");
    expect(visibleDesktop.map((n) => n.id)).toEqual(["r1"]);
    const visibleMobile = getVisibleComponents(tree as any, editor, "mobile");
    // r2.hidden=[desktop]; on mobile it's shown
    expect(visibleMobile.map((n) => n.id)).toEqual(["r1", "r2"]);
  });

  test("resolveParentKind returns ROOT when no parent and component type otherwise", () => {
    expect(resolveParentKind(tree as any, undefined)).toBe("ROOT");
    expect(resolveParentKind(tree as any, "r1")).toBe("Row");
  });
});


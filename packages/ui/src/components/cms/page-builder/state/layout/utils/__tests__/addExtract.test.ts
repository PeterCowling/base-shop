// packages/ui/src/components/cms/page-builder/state/layout/utils/__tests__/addExtract.test.ts
import { addComponent } from "../addComponent";
import { extractComponent } from "../extractComponent";

describe("addComponent and extractComponent", () => {
  test("addComponent inserts at root index when no parentId", () => {
    const list = [{ id: "x", type: "block" }] as any[];
    const out = addComponent(list as any, undefined, 0, { id: "y", type: "block" } as any);
    expect(out.map((n: any) => n.id)).toEqual(["y", "x"]);
    // original untouched
    expect(list.map((n: any) => n.id)).toEqual(["x"]);
  });

  test("addComponent inserts into children of matching parent", () => {
    const tree = [{ id: "p", type: "row", children: [{ id: "a" }, { id: "b" }] }] as any[];
    const out = addComponent(tree as any, "p", 1, { id: "z" } as any);
    const kids = (out[0] as any).children as any[];
    expect(kids.map((n) => n.id)).toEqual(["a", "z", "b"]);
  });

  test("extractComponent removes at root and returns tuple [item, rest]", () => {
    const list = [{ id: "a" }, { id: "b" }, { id: "c" }] as any[];
    const [item, rest] = extractComponent(list as any, undefined, 1);
    expect((item as any)?.id).toBe("b");
    expect((rest as any[]).map((n) => n.id)).toEqual(["a", "c"]);
  });

  test("extractComponent removes from children of specific parent", () => {
    const tree = [{ id: "p", type: "row", children: [{ id: "a" }, { id: "b" }] }] as any[];
    const [item, next] = extractComponent(tree as any, "p", 0);
    expect((item as any)?.id).toBe("a");
    const kids = (next[0] as any).children as any[];
    expect(kids.map((n) => n.id)).toEqual(["b"]);
  });
});


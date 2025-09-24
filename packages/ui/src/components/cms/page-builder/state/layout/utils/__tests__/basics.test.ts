// packages/ui/src/components/cms/page-builder/state/layout/utils/__tests__/basics.test.ts
import { addAt } from "../addAt";
import { walkTree } from "../walkTree";
import { getNodeById } from "../getNodeById";
import { getParentOfId } from "../getParentOfId";

describe("state/layout/utils basics", () => {
  const tree = [
    { id: "r1", type: "row", children: [{ id: "c1", type: "col" }, { id: "c2", type: "col" }] },
    { id: "r2", type: "row", children: [{ id: "c3", type: "col" }] },
  ] as any[];

  test("addAt inserts at index without mutating original", () => {
    const orig = [{ id: "a" }, { id: "c" }] as any[];
    const out = addAt(orig as any, 1, { id: "b" } as any);
    expect(out.map((x) => x.id)).toEqual(["a", "b", "c"]);
    expect(orig.map((x) => x.id)).toEqual(["a", "c"]);
  });

  test("walkTree visits all nodes with parent info", () => {
    const visited: string[] = [];
    walkTree(tree as any, (n, p) => {
      visited.push(`${n.id}:${p?.id ?? '-'}`);
    });
    expect(visited).toEqual([
      "r1:-",
      "c1:r1",
      "c2:r1",
      "r2:-",
      "c3:r2",
    ]);
  });

  test("getNodeById and getParentOfId work across tree", () => {
    expect(getNodeById(tree as any, "c2")?.id).toBe("c2");
    expect(getParentOfId(tree as any, "c2")?.id).toBe("r1");
    expect(getNodeById(tree as any, "missing")).toBeNull();
    expect(getParentOfId(tree as any, "r1")).toBeNull();
  });
});


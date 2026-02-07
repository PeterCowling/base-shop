// packages/ui/src/components/cms/page-builder/state/layout/utils/__tests__/moveAcross.test.ts
import { moveComponent } from "../moveComponent";

describe("moveComponent across parents", () => {
  const base = [
    { id: "p1", type: "row", children: [{ id: "a" }, { id: "b" }] },
    { id: "p2", type: "row", children: [{ id: "c" }] },
  ] as any[];

  test("moves child from p1 to p2 at target index", () => {
    const out = moveComponent(base as any, { parentId: "p1", index: 1 }, { parentId: "p2", index: 1 });
    const p1Kids = (out[0] as any).children as any[];
    const p2Kids = (out[1] as any).children as any[];
    expect(p1Kids.map((n) => n.id)).toEqual(["a"]);
    expect(p2Kids.map((n) => n.id)).toEqual(["c", "b"]);
  });

  test("no-op when source index is out of range (returns original list)", () => {
    const out = moveComponent(base as any, { parentId: "p1", index: 99 }, { parentId: "p2", index: 0 });
    // Reference equality indicates early return without cloning
    expect(out).toBe(base as any);
  });
});


// packages/ui/src/components/cms/page-builder/state/layout/utils/__tests__/updateAndDecorate.test.ts
import { decorateComponentForViewport } from "../decorateComponentForViewport";
import { decorateTreeForViewport } from "../decorateTreeForViewport";
import { updateComponent } from "../updateComponent";

describe("update and decorate utils", () => {
  test("updateComponent normalizes numeric fields from strings", () => {
    const tree = [{ id: "x", type: "row", columns: 1 }] as any[];
    const next = updateComponent(tree as any, "x", { columns: "3" } as any);
    expect((next[0] as any).columns).toBe(3);
  });

  test("decorateComponentForViewport merges editor flags and resolves hidden per viewport", () => {
    const node = { id: "a", type: "block" } as any;
    const editor = { a: { name: "Title", locked: true, zIndex: 10, hidden: ["mobile"] } } as any;
    const desktop = decorateComponentForViewport(node as any, editor as any, "desktop");
    const mobile = decorateComponentForViewport(node as any, editor as any, "mobile");
    expect(desktop.name).toBe("Title");
    expect(desktop.locked).toBe(true);
    expect(desktop.zIndex).toBe(10);
    expect(desktop.hidden).toBe(false);
    expect(mobile.hidden).toBe(true);
  });

  test("decorateTreeForViewport maps over children and applies flags", () => {
    const tree = [{ id: "p", type: "row", children: [{ id: "c", type: "block" }] }] as any[];
    const editor = { c: { locked: true } } as any;
    const out = decorateTreeForViewport(tree as any, editor as any, "desktop");
    expect(((out[0] as any).children[0] as any).locked).toBe(true);
  });

  test("decorateComponentForViewport respects node.hidden fallback when editor has no flag", () => {
    const node = { id: "z", type: "block", hidden: true } as any;
    const edited = decorateComponentForViewport(node as any, {} as any, undefined);
    expect(edited.hidden).toBe(true);
    const node2 = { id: "z2", type: "block", hidden: false } as any;
    const edited2 = decorateComponentForViewport(node2 as any, {} as any, "desktop");
    expect(edited2.hidden).toBe(false);
  });
});

import type { HistoryState,PageComponent } from "@acme/types";

import { historyStateSchema } from "..";
import {
  add,
  duplicate,
  move,
  remove,
  resize,
  set,
  setGridCols,
  update,
} from "../layout";

describe("layout actions", () => {
  const a = { id: "a", type: "Text" } as PageComponent;
  const b = { id: "b", type: "Image" } as PageComponent;
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };

  it("adds components", () => {
    const state = add(init, { type: "add", component: a });
    expect(state.present).toEqual([a]);
    expect(state.past).toEqual([[]]);
  });

  it("adds child at index within parent and records history", () => {
    const first = { id: "c1", type: "Text" } as PageComponent;
    const second = { id: "c2", type: "Image" } as PageComponent;
    const parent = {
      id: "parent",
      type: "Container",
      children: [first, second],
    } as any;
    const newChild = { id: "c3", type: "Video" } as PageComponent;
    const state = add(
      { ...init, present: [parent as PageComponent] },
      {
        type: "add",
        parentId: "parent",
        index: 1,
        component: newChild,
      },
    );
    const children = (state.present[0] as any).children;
    expect(children).toEqual([first, newChild, second]);
    expect(state.past[0][0]).toBe(parent);
  });

  it("moves components", () => {
    const state = move(
      { ...init, present: [a, b] },
      { type: "move", from: { index: 0 }, to: { index: 1 } },
    );
    expect(state.present).toEqual([b, a]);
  });

  it("moves component between parent and root and commits history", () => {
    const child = { id: "child", type: "Text" } as PageComponent;
    const parent = { id: "parent", type: "Container", children: [child] } as any;
    const other = { id: "other", type: "Image" } as PageComponent;

    const state1 = move(
      { ...init, present: [parent as PageComponent, other] },
      { type: "move", from: { parentId: "parent", index: 0 }, to: { index: 1 } },
    );

    expect(state1.present).toEqual([
      { id: "parent", type: "Container", children: [] },
      child,
      other,
    ]);
    expect(state1.past).toEqual([[parent, other]]);

    const state2 = move(
      state1,
      { type: "move", from: { index: 1 }, to: { parentId: "parent", index: 0 } },
    );

    expect(state2.present).toEqual([
      { id: "parent", type: "Container", children: [child] },
      other,
    ]);
    expect(state2.past).toEqual([
      [parent, other],
      [{ id: "parent", type: "Container", children: [] }, child, other],
    ]);
  });

  it("removes component", () => {
    const state = remove(
      { ...init, present: [a, b] },
      { type: "remove", id: "a" },
    );
    expect(state.present).toEqual([b]);
  });

  it("removes nested component without affecting siblings", () => {
    const target = { id: "target", type: "Text" } as PageComponent;
    const sibling = { id: "sibling", type: "Text" } as PageComponent;
    const parent = {
      id: "parent",
      type: "Container",
      children: [target, sibling],
    } as any;
    const other = { id: "other", type: "Image" } as PageComponent;
    const root = {
      id: "root",
      type: "Container",
      children: [parent, other],
    } as any;
    const state = remove(
      { ...init, present: [root as PageComponent] },
      { type: "remove", id: "target" },
    );
    const result = state.present[0] as any;
    expect(result.children.map((c: any) => c.id)).toEqual(["parent", "other"]);
    expect(result.children[0].children).toHaveLength(1);
    expect(result.children[0].children[0].id).toBe("sibling");
  });

  it("duplicates component with new id", () => {
    const state = duplicate(
      { ...init, present: [a, b] },
      { type: "duplicate", id: "a" },
    );
    expect(state.present).toHaveLength(3);
    const dup = state.present[1];
    expect(dup.id).not.toBe("a");
    expect(dup.type).toBe("Text");
  });

    it("deep clones nested children when duplicating", () => {
      const child = { id: "child", type: "Text" } as PageComponent;
      const parent = { id: "parent", type: "Container", children: [child] } as any;
      const state = duplicate(
        { ...init, present: [parent as PageComponent] },
        { type: "duplicate", id: "parent" },
      );
      expect(state.present).toHaveLength(2);
      const orig = state.present[0] as any;
      const clone = state.present[1] as any;
      expect(clone.id).not.toBe(orig.id);
      expect(clone.children[0].id).not.toBe(orig.children[0].id);
    });

    it("duplicates nested components and preserves ancestors", () => {
      const grandchild = { id: "grandchild", type: "Text" } as PageComponent;
      const child = {
        id: "child",
        type: "Container",
        children: [grandchild],
      } as PageComponent;
      const parent = {
        id: "parent",
        type: "Container",
        children: [child],
      } as PageComponent;
      const state = duplicate(
        { ...init, present: [parent] },
        { type: "duplicate", id: "child" },
      );
      expect(state.present).toHaveLength(1);
      const resultParent = state.present[0] as any;
      expect(resultParent.id).toBe("parent");
      expect(resultParent.children).toHaveLength(2);
      const [orig, clone] = resultParent.children as any[];
      expect(orig).toBe(child);
      expect(clone.id).not.toBe("child");
      expect(clone.children[0].id).not.toBe(grandchild.id);
      expect(orig.children[0]).toBe(grandchild);
    });

    it("updates component", () => {
      const state = update(
        { ...init, present: [a] },
        { type: "update", id: "a", patch: { foo: "bar" } },
    );
    expect((state.present[0] as any).foo).toBe("bar");
  });

  it("coerces numeric string fields on nested components", () => {
    const child = { id: "child", type: "Carousel" } as PageComponent;
    const parent = { id: "parent", type: "Container", children: [child] } as any;
    const state = update(
      { ...init, present: [parent as PageComponent] },
      {
        type: "update",
        id: "child",
        patch: { minItems: "2", columns: "3" } as any,
      },
    );
    const updated = ((state.present[0] as any).children[0]) as any;
    expect(updated.minItems).toBe(2);
    expect(updated.columns).toBe(3);
    expect(typeof updated.minItems).toBe("number");
    expect(typeof updated.columns).toBe("number");
  });

  it("preserves offsets when resizing without explicit left/top", () => {
    const comp = {
      id: "abs",
      type: "Text",
      position: "absolute",
      left: "5px",
      top: "10px",
    } as PageComponent;
    const state = resize(
      { past: [], present: [comp], future: [], gridCols: 12 },
      { type: "resize", id: "abs", width: "100%" },
    );
    expect(state.present[0]).toMatchObject({
      left: "5px",
      top: "10px",
      width: "100%",
    });
  });

  it("sets components", () => {
    const state = set(init, { type: "set", components: [a, b] });
    expect(state.present).toEqual([a, b]);
    expect(state.past).toEqual([[]]);
  });

  it("replaces existing components and clears future", () => {
    const state = set(
      { past: [], present: [a], future: [[b]], gridCols: 12 },
      { type: "set", components: [b] },
    );
    expect(state.present).toEqual([b]);
    expect(state.past).toEqual([[a]]);
    expect(state.future).toEqual([]);
  });

  it("sets grid columns", () => {
    const state = setGridCols(init, { type: "set-grid-cols", gridCols: 16 });
    expect(state.gridCols).toBe(16);
  });
});

describe("historyStateSchema", () => {
  it("applies defaults when input is undefined", () => {
    expect(historyStateSchema.parse(undefined)).toEqual({
      past: [],
      present: [],
      future: [],
      gridCols: 12,
      editor: {},
    });
  });
});

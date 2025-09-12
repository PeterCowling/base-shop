import {
  add,
  move,
  remove,
  duplicate,
  update,
  resize,
  set,
  setGridCols,
} from "../layout";
import { historyStateSchema } from "..";
import type { PageComponent, HistoryState } from "@acme/types";

describe("layout actions", () => {
  const a = { id: "a", type: "Text" } as PageComponent;
  const b = { id: "b", type: "Image" } as PageComponent;
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };

  it("adds components", () => {
    const state = add(init, { type: "add", component: a });
    expect(state.present).toEqual([a]);
    expect(state.past).toEqual([[]]);
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

  it("updates component", () => {
    const state = update(
      { ...init, present: [a] },
      { type: "update", id: "a", patch: { foo: "bar" } },
    );
    expect((state.present[0] as any).foo).toBe("bar");
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
    });
  });
});

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

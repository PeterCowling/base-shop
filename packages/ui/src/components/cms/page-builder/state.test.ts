import { historyStateSchema, reducer } from "./state";
import type { PageComponent, HistoryState } from "@acme/types";

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

describe("state reducer", () => {
  const a = { id: "a", type: "Text" } as PageComponent;
  const b = { id: "b", type: "Image" } as PageComponent;
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };

  it("adds components", () => {
    const state = reducer(init, { type: "add", component: a });
    expect(state.present).toEqual([a]);
    expect(state.past).toEqual([[]]);
  });

  it("moves components", () => {
    const state = reducer(
      { ...init, present: [a, b] },
      { type: "move", from: { index: 0 }, to: { index: 1 } }
    );
    expect(state.present).toEqual([b, a]);
  });

  it("removes component", () => {
    const state = reducer(
      { ...init, present: [a, b] },
      { type: "remove", id: "a" }
    );
    expect(state.present).toEqual([b]);
  });

  it("updates component", () => {
    const state = reducer(
      { ...init, present: [a] },
      { type: "update", id: "a", patch: { foo: "bar" } }
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
    const state = reducer(
      { past: [], present: [comp], future: [] },
      { type: "resize", id: "abs", width: "100%" }
    );
    expect(state.present[0]).toMatchObject({
      left: "5px",
      top: "10px",
      width: "100%",
    });
  });

  it("undo and redo", () => {
    const added = reducer(init, { type: "add", component: a });
    const undone = reducer(added, { type: "undo" });
    expect(undone.present).toEqual([]);
    const redone = reducer(undone, { type: "redo" });
    expect(redone.present).toEqual([a]);
  });
});

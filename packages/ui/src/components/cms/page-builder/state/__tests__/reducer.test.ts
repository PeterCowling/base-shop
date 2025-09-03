import reducer from "../reducer";
import type { HistoryState, PageComponent } from "@acme/types";

describe("page builder state reducer", () => {
  const a = { id: "a", type: "Text" } as PageComponent;
  const b = { id: "b", type: "Image" } as PageComponent;
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };

  it("handles add, undo, and redo", () => {
    const added = reducer(init, { type: "add", component: a });
    expect(added.present).toEqual([a]);
    const undone = reducer(added, { type: "undo" });
    expect(undone.present).toEqual([]);
    const redone = reducer(undone, { type: "redo" });
    expect(redone.present).toEqual([a]);
  });

  it("clears future on new action after undo", () => {
    const added = reducer(init, { type: "add", component: a });
    const undone = reducer(added, { type: "undo" });
    const branched = reducer(undone, { type: "add", component: b });
    expect(branched.present).toEqual([b]);
    expect(branched.future).toEqual([]);
  });

  it("resets state with set action", () => {
    const added = reducer(init, { type: "add", component: a });
    const reset = reducer(added, { type: "set", components: [] });
    expect(reset.present).toEqual([]);
    expect(reset.past).toEqual([[], [a]]);
    expect(reset.future).toEqual([]);
  });
});

import { commit, undo, redo } from "../history";
import type { HistoryState, PageComponent } from "@acme/types";

describe("history actions", () => {
  const a = { id: "a", type: "Text" } as PageComponent;
  const b = { id: "b", type: "Image" } as PageComponent;
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };

  it("adds entries to history", () => {
    const state = commit(init, [a]);
    expect(state.past).toEqual([[]]);
    expect(state.present).toEqual([a]);
    expect(state.future).toEqual([]);
  });

  it("undo and redo", () => {
    const added = commit(init, [a]);
    const undone = undo(added);
    expect(undone.present).toEqual([]);
    const redone = redo(undone);
    expect(redone.present).toEqual([a]);
  });

  it("clears future on new commits after undo", () => {
    const first = commit(init, [a]);
    const second = commit(first, [a, b]);
    const undone = undo(second);
    const branched = commit(undone, [b]);
    expect(branched.past).toEqual([[], [a]]);
    expect(branched.present).toEqual([b]);
    expect(branched.future).toEqual([]);
  });
});

import type { HistoryState, PageComponent } from "@acme/types";

import { commit, redo,undo } from "../history";

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

  it("preserves gridCols across commit, undo, and redo", () => {
    const committed = commit(init, [a]);
    const undone = undo(committed);
    const redone = redo(undone);
    expect(committed.gridCols).toBe(init.gridCols);
    expect(undone.gridCols).toBe(init.gridCols);
    expect(redone.gridCols).toBe(init.gridCols);
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

  it("does not allocate new object when committing identical present", () => {
    const first = commit(init, [a]);
    const result = commit(first, first.present);
    expect(Object.is(result, first)).toBe(true);
  });

  it("returns original state on undo with empty past", () => {
    const result = undo(init);
    expect(Object.is(result, init)).toBe(true);
  });

  it("returns original state on redo with empty future", () => {
    const state = commit(init, [a]);
    const result = redo(state);
    expect(Object.is(result, state)).toBe(true);
  });

  it("preserves editor metadata across history transitions", () => {
    const withEditor = { ...init, editor: { a: { name: "A", locked: true } } } as HistoryState;
    const committed = commit(withEditor, [a]);
    expect((committed as any).editor).toEqual({ a: { name: "A", locked: true } });
    const undone = undo(committed);
    expect((undone as any).editor).toEqual({ a: { name: "A", locked: true } });
    const redone = redo(undone);
    expect((redone as any).editor).toEqual({ a: { name: "A", locked: true } });
  });
});

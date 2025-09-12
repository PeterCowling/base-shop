import reducer from "../reducer";
import type { HistoryState, PageComponent } from "@acme/types";

describe("page builder state reducer", () => {
  const a = { id: "a", type: "Text" } as PageComponent;
  const b = { id: "b", type: "Image" } as PageComponent;
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };

  it("returns state for unknown action", () => {
    const result = reducer(init, { type: "unknown" } as any);
    expect(result).toBe(init);
  });

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

  it("handles move action", () => {
    const addedA = reducer(init, { type: "add", component: a });
    const addedB = reducer(addedA, { type: "add", component: b });
    const moved = reducer(addedB, {
      type: "move",
      from: { index: 0 },
      to: { index: 1 },
    });
    expect(moved.present).toEqual([b, a]);
    expect(moved.past).toEqual([[], [a], [a, b]]);
    expect(moved.future).toEqual([]);
    expect(moved.gridCols).toBe(12);
  });

  it("handles remove action", () => {
    const addedA = reducer(init, { type: "add", component: a });
    const addedB = reducer(addedA, { type: "add", component: b });
    const removed = reducer(addedB, { type: "remove", id: "a" });
    expect(removed.present).toEqual([b]);
    expect(removed.past).toEqual([[], [a], [a, b]]);
    expect(removed.future).toEqual([]);
    expect(removed.gridCols).toBe(12);
  });

  it("handles duplicate action", () => {
    const added = reducer(init, { type: "add", component: a });
    const duplicated = reducer(added, { type: "duplicate", id: "a" });
    expect(duplicated.present).toHaveLength(2);
    const dup = duplicated.present[1];
    expect(dup.id).not.toBe("a");
    expect(dup.type).toBe("Text");
    expect(duplicated.past).toEqual([[], [a]]);
    expect(duplicated.future).toEqual([]);
    expect(duplicated.gridCols).toBe(12);
  });

  it("handles update action", () => {
    const added = reducer(init, { type: "add", component: a });
    const updated = reducer(added, {
      type: "update",
      id: "a",
      patch: { foo: "bar" },
    });
    expect((updated.present[0] as any).foo).toBe("bar");
    expect(updated.past).toEqual([[], [a]]);
    expect(updated.future).toEqual([]);
    expect(updated.gridCols).toBe(12);
  });

  it("handles resize action", () => {
    const added = reducer(init, { type: "add", component: a });
    const resized = reducer(added, {
      type: "resize",
      id: "a",
      width: "100",
      height: "200px",
    });
    expect(resized.present[0]).toMatchObject({
      width: "100px",
      height: "200px",
    });
    expect(resized.past).toEqual([[], [a]]);
    expect(resized.future).toEqual([]);
    expect(resized.gridCols).toBe(12);
  });

  it("handles set-grid-cols action", () => {
    const added = reducer(init, { type: "add", component: a });
    const updatedCols = reducer(added, {
      type: "set-grid-cols",
      gridCols: 16,
    });
    expect(updatedCols.gridCols).toBe(16);
    expect(updatedCols.present).toEqual([a]);
    expect(updatedCols.past).toEqual([[]]);
    expect(updatedCols.future).toEqual([]);
  });
});

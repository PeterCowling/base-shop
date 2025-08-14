import { undo, redo, commit } from "./history";
import type { HistoryState, PageComponent } from "@acme/types";

describe("history actions", () => {
  const a = { id: "a", type: "Text" } as PageComponent;
  const init: HistoryState = { past: [], present: [], future: [], gridCols: 12 };

  it("undo and redo", () => {
    const added = commit(init, [a]);
    const undone = undo(added);
    expect(undone.present).toEqual([]);
    const redone = redo(undone);
    expect(redone.present).toEqual([a]);
  });
});

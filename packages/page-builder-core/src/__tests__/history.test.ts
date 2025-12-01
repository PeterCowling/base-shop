import type { HistoryState, PageComponent } from "@acme/types";
import { commit, redo, undo } from "../history";

function makeState(overrides: Partial<HistoryState> = {}): HistoryState {
  const base: HistoryState = {
    past: [],
    present: [],
    future: [],
    gridCols: 12,
  };
  return { ...base, ...overrides };
}

describe("history helpers", () => {
  const initialPresent: PageComponent[] = [
    { id: "a", type: "Section" } as unknown as PageComponent,
  ];

  it("commit appends present to past, replaces present, clears future and preserves metadata", () => {
    const state = makeState({
      past: [[{ id: "p1", type: "Section" } as unknown as PageComponent]],
      present: initialPresent,
      future: [[{ id: "f1", type: "Section" } as unknown as PageComponent]],
      gridCols: 16,
      editor: {
        a: { name: "Section A" },
      },
    });

    const nextPresent: PageComponent[] = [
      { id: "b", type: "Section" } as unknown as PageComponent,
    ];

    const next = commit(state, nextPresent);

    expect(next).not.toBe(state);
    expect(next.past).toEqual([...state.past, state.present]);
    expect(next.present).toBe(nextPresent);
    expect(next.future).toEqual([]);
    expect(next.gridCols).toBe(16);
    expect(next.editor).toBe(state.editor);
  });

  it("commit returns original state when next === present", () => {
    const state = makeState({ present: initialPresent });
    const result = commit(state, state.present);
    expect(result).toBe(state);
  });

  it("undo moves last past entry to present and pushes previous present into future", () => {
    const pastEntry: PageComponent[] = [
      { id: "p", type: "Section" } as unknown as PageComponent,
    ];
    const currentPresent: PageComponent[] = [
      { id: "c", type: "Section" } as unknown as PageComponent,
    ];
    const state = makeState({
      past: [pastEntry],
      present: currentPresent,
      future: [],
      editor: {
        c: { hidden: ["desktop"] },
      },
    });

    const next = undo(state);

    expect(next.present).toBe(pastEntry);
    expect(next.past).toEqual([]);
    expect(next.future).toEqual([currentPresent]);
    expect(next.gridCols).toBe(state.gridCols);
    expect(next.editor).toBe(state.editor);
  });

  it("undo returns original state when there is no past", () => {
    const state = makeState();
    const result = undo(state);
    expect(result).toBe(state);
  });

  it("redo moves first future entry to present and appends previous present to past", () => {
    const futureEntry: PageComponent[] = [
      { id: "f", type: "Section" } as unknown as PageComponent,
    ];
    const currentPresent: PageComponent[] = [
      { id: "c", type: "Section" } as unknown as PageComponent,
    ];
    const state = makeState({
      past: [],
      present: currentPresent,
      future: [futureEntry],
      editor: {
        f: { hidden: ["mobile"] },
      },
    });

    const next = redo(state);

    expect(next.present).toBe(futureEntry);
    expect(next.past).toEqual([currentPresent]);
    expect(next.future).toEqual([]);
    expect(next.gridCols).toBe(state.gridCols);
    expect(next.editor).toBe(state.editor);
  });

  it("redo returns original state when there is no future", () => {
    const state = makeState();
    const result = redo(state);
    expect(result).toBe(state);
  });
});


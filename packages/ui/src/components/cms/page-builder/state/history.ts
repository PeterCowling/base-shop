import type { HistoryState, PageComponent } from "@acme/types";

// commit helper used by layout actions to update history
export function commit(state: HistoryState, next: PageComponent[]): HistoryState {
  if (next === state.present) return state;
  return {
    past: [...state.past, state.present],
    present: next,
    future: [],
    gridCols: state.gridCols,
    // carry editor metadata through history transitions
    ...(state.editor !== undefined ? { editor: state.editor } : {}),
  };
}

export function undo(state: HistoryState): HistoryState {
  const previous = state.past.at(-1);
  if (!previous) return state;
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
    gridCols: state.gridCols,
    ...(state.editor !== undefined ? { editor: state.editor } : {}),
  };
}

export function redo(state: HistoryState): HistoryState {
  const next = state.future[0];
  if (!next) return state;
  return {
    past: [...state.past, state.present],
    present: next,
    future: state.future.slice(1),
    gridCols: state.gridCols,
    ...(state.editor !== undefined ? { editor: state.editor } : {}),
  };
}

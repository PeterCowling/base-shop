import type { HistoryState } from "@acme/types";

import { redo,undo } from "./history";
import type { Action } from "./layout";
import {
  add,
  duplicate,
  move,
  remove,
  resize,
  set,
  setBreakpoints,
  setGridCols,
  update,
 updateEditor } from "./layout";

export function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "undo":
      return undo(state);
    case "redo":
      return redo(state);
    case "set-grid-cols":
      return setGridCols(state, action);
    case "set-breakpoints":
      return setBreakpoints(state, action);
    case "add":
      return add(state, action);
    case "move":
      return move(state, action);
    case "remove":
      return remove(state, action);
    case "duplicate":
      return duplicate(state, action);
    case "update":
      return update(state, action);
    case "resize":
      return resize(state, action);
    case "set":
      return set(state, action);
    case "update-editor":
      return updateEditor(state, action);
    default:
      return state;
  }
}

export default reducer;

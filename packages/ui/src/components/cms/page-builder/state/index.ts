import type { HistoryState } from "@acme/types";
import type { Action } from "./actions";
import { add, move, remove, duplicate, update, resize, set, setGridCols } from "./layout";
import { undo, redo } from "./history";

export type { Action } from "./actions";
export { componentMetadataSchema } from "./component.schema";
export { layoutSchema } from "./layout.schema";
export { historyStateSchema } from "./history.schema";

export function reducer(state: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case "undo":
      return undo(state);
    case "redo":
      return redo(state);
    case "set-grid-cols":
      return setGridCols(state, action);
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
    default:
      return state;
  }
}

export default reducer;

import type { HistoryState } from "@acme/types";
import type { RemoveAction } from "./types";
import { removeComponent } from "./helpers";
import { commit } from "../history";

export function remove(state: HistoryState, action: RemoveAction): HistoryState {
  return commit(state, removeComponent(state.present, action.id));
}

export default remove;

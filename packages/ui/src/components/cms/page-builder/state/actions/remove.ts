import type { HistoryState } from "@acme/types";
import type { RemoveAction } from "./types";
import { commit } from "../history";
import { removeComponent } from "./helpers";

export function remove(state: HistoryState, action: RemoveAction): HistoryState {
  return commit(state, removeComponent(state.present, action.id));
}

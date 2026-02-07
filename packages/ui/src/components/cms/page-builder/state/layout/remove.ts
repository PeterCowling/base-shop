import type { HistoryState } from "@acme/types";

import { commit } from "../history";

import type { RemoveAction } from "./types";
import { removeComponent } from "./utils";

export function remove(state: HistoryState, action: RemoveAction): HistoryState {
  return commit(state, removeComponent(state.present, action.id));
}

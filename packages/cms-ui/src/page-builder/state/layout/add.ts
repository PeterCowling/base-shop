import type { HistoryState } from "@acme/types";

import { commit } from "../history";

import type { AddAction } from "./types";
import { addComponent } from "./utils";

export function add(state: HistoryState, action: AddAction): HistoryState {
  return commit(
    state,
    addComponent(state.present, action.parentId, action.index, action.component),
  );
}

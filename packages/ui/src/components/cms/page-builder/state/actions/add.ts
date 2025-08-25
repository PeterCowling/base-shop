import type { HistoryState } from "@acme/types";
import type { AddAction } from "./types";
import { commit } from "../history";
import { addComponent } from "./helpers";

export function add(state: HistoryState, action: AddAction): HistoryState {
  return commit(
    state,
    addComponent(state.present, action.parentId, action.index, action.component),
  );
}

import type { HistoryState } from "@acme/types";
import type { AddAction } from "./types";
import { addComponent } from "./helpers";
import { commit } from "../history";

export function add(state: HistoryState, action: AddAction): HistoryState {
  return commit(
    state,
    addComponent(state.present, action.parentId, action.index, action.component),
  );
}

export default add;

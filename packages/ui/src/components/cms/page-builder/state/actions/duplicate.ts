import type { HistoryState } from "@acme/types";
import type { DuplicateAction } from "./types";
import { duplicateComponent } from "./helpers";
import { commit } from "../history";

export function duplicate(state: HistoryState, action: DuplicateAction): HistoryState {
  return commit(state, duplicateComponent(state.present, action.id));
}

export default duplicate;

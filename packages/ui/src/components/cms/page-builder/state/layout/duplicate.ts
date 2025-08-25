import type { HistoryState } from "@acme/types";
import type { DuplicateAction } from "./types";
import { commit } from "../history";
import { duplicateComponent } from "./utils";

export function duplicate(state: HistoryState, action: DuplicateAction): HistoryState {
  return commit(state, duplicateComponent(state.present, action.id));
}

import type { HistoryState } from "@acme/types";
import type { UpdateAction } from "./types";
import { updateComponent } from "./helpers";
import { commit } from "../history";

export function update(state: HistoryState, action: UpdateAction): HistoryState {
  return commit(state, updateComponent(state.present, action.id, action.patch));
}

export default update;

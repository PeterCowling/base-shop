import type { HistoryState } from "@acme/types";

import { commit } from "../history";

import type { UpdateAction } from "./types";
import { updateComponent } from "./utils";

export function update(state: HistoryState, action: UpdateAction): HistoryState {
  return commit(state, updateComponent(state.present, action.id, action.patch));
}

import type { HistoryState } from "@acme/types";

import { commit } from "../history";

import type { MoveAction } from "./types";
import { moveComponent } from "./utils";

export function move(state: HistoryState, action: MoveAction): HistoryState {
  return commit(state, moveComponent(state.present, action.from, action.to));
}

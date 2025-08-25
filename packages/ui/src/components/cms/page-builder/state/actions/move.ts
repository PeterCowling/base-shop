import type { HistoryState } from "@acme/types";
import type { MoveAction } from "./types";
import { commit } from "../history";
import { moveComponent } from "./helpers";

export function move(state: HistoryState, action: MoveAction): HistoryState {
  return commit(state, moveComponent(state.present, action.from, action.to));
}

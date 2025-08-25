import type { HistoryState } from "@acme/types";
import type { MoveAction } from "./types";
import { moveComponent } from "./helpers";
import { commit } from "../history";

export function move(state: HistoryState, action: MoveAction): HistoryState {
  return commit(state, moveComponent(state.present, action.from, action.to));
}

export default move;

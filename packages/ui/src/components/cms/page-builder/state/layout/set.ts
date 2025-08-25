import type { HistoryState } from "@acme/types";
import type { SetAction } from "./types";
import { commit } from "../history";

export function set(state: HistoryState, action: SetAction): HistoryState {
  return commit(state, action.components);
}

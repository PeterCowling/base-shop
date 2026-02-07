import type { HistoryState } from "@acme/types";

import { commit } from "../history";

import type { SetAction } from "./types";

export function set(state: HistoryState, action: SetAction): HistoryState {
  return commit(state, action.components);
}

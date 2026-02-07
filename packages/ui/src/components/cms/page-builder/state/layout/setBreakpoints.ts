import type { HistoryState } from "@acme/types";

import type { SetBreakpointsAction } from "./types";

export function setBreakpoints(
  state: HistoryState,
  action: SetBreakpointsAction,
): HistoryState {
  return { ...state, breakpoints: [...action.breakpoints] } as HistoryState;
}

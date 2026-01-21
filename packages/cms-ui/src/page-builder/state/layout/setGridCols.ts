import type { HistoryState } from "@acme/types";

import type { SetGridColsAction } from "./types";

export function setGridCols(
  state: HistoryState,
  action: SetGridColsAction,
): HistoryState {
  return { ...state, gridCols: action.gridCols };
}

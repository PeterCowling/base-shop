import type { HistoryState } from "@acme/types";
import type { UpdateEditorAction } from "./types";

export function updateEditor(
  state: HistoryState,
  action: UpdateEditorAction,
): HistoryState {
  const current = (state as any).editor ?? {};
  const nextForId = { ...(current[action.id] ?? {}), ...action.patch } as any;
  return { ...state, editor: { ...current, [action.id]: nextForId } } as HistoryState;
}


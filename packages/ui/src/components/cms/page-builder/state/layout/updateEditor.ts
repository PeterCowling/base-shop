import type { HistoryState } from "@acme/types";
import type { UpdateEditorAction } from "./types";

export function updateEditor(
  state: HistoryState,
  action: UpdateEditorAction,
): HistoryState {
  const current: NonNullable<HistoryState["editor"]> = state.editor ?? {};
  const nextForId = { ...(current[action.id] ?? {}), ...action.patch };
  return { ...state, editor: { ...current, [action.id]: nextForId } } as HistoryState;
}

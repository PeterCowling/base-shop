import type { HistoryState } from "@acme/types";
import type {
  AddAction,
  MoveAction,
  RemoveAction,
  DuplicateAction,
  UpdateAction,
  ResizeAction,
  SetAction,
  ChangeAction,
  UndoAction,
  RedoAction,
  SetGridColsAction,
  Action,
} from "./types";
export type {
  AddAction,
  MoveAction,
  RemoveAction,
  DuplicateAction,
  UpdateAction,
  ResizeAction,
  SetAction,
  ChangeAction,
  UndoAction,
  RedoAction,
  SetGridColsAction,
  Action,
};
export function add(state: HistoryState, action: AddAction): HistoryState;
export function move(state: HistoryState, action: MoveAction): HistoryState;
export function remove(state: HistoryState, action: RemoveAction): HistoryState;
export function duplicate(state: HistoryState, action: DuplicateAction): HistoryState;
export function update(state: HistoryState, action: UpdateAction): HistoryState;
export function resize(state: HistoryState, action: ResizeAction): HistoryState;
export function set(state: HistoryState, action: SetAction): HistoryState;
export function setGridCols(state: HistoryState, action: SetGridColsAction): HistoryState;
//# sourceMappingURL=index.d.ts.map

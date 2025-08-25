import type { HistoryState } from "@acme/types";
import type { AddAction, MoveAction, RemoveAction, DuplicateAction, UpdateAction, ResizeAction, SetAction, SetGridColsAction } from "../hooks/actions";
export declare function add(state: HistoryState, action: AddAction): HistoryState;
export declare function move(state: HistoryState, action: MoveAction): HistoryState;
export declare function remove(state: HistoryState, action: RemoveAction): HistoryState;
export declare function duplicate(state: HistoryState, action: DuplicateAction): HistoryState;
export declare function update(state: HistoryState, action: UpdateAction): HistoryState;
export declare function resize(state: HistoryState, action: ResizeAction): HistoryState;
export declare function set(state: HistoryState, action: SetAction): HistoryState;
export declare function setGridCols(state: HistoryState, action: SetGridColsAction): HistoryState;
//# sourceMappingURL=layout.d.ts.map
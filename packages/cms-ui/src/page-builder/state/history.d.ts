import type { HistoryState, PageComponent } from "@acme/types";
export declare function commit(state: HistoryState, next: PageComponent[]): HistoryState;
export declare function undo(state: HistoryState): HistoryState;
export declare function redo(state: HistoryState): HistoryState;
//# sourceMappingURL=history.d.ts.map
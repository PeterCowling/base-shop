import type { HistoryState } from "@acme/types";
import type { Action } from "./actions";
export type { Action } from "./actions";
export { componentMetadataSchema } from "./component.schema";
export { layoutSchema } from "./layout.schema";
export { historyStateSchema } from "./history.schema";
export declare function reducer(state: HistoryState, action: Action): HistoryState;
export default reducer;
//# sourceMappingURL=index.d.ts.map

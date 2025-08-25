import type { DragEvent } from "react";
import type { Action } from "./actions";
import type { UseFileDropResult } from "./types";
interface Options {
    shop: string;
    dispatch: (action: Action) => void;
}
declare const useFileDrop: ({ shop, dispatch }: Options) => UseFileDropResult;
export default useFileDrop;
//# sourceMappingURL=useFileDrop.d.ts.map
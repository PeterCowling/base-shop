import type { DragEvent } from "react";
import type { Action } from "../state/layout";
interface Options {
    shop: string;
    dispatch: (action: Action) => void;
}
declare const useFileDrop: ({ shop, dispatch }: Options) => {
    dragOver: boolean;
    setDragOver: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    handleFileDrop: (ev: DragEvent<HTMLDivElement>) => void;
    progress: import("../../../..").UploadProgress | null;
    isValid: boolean | null;
};
export default useFileDrop;
//# sourceMappingURL=useFileDrop.d.ts.map

import type { Page, PageComponent, HistoryState } from "@acme/types";
import { type Action } from "./actions";
import type { UsePageBuilderStateResult } from "./types";

interface Params {
    page: Page;
    history?: HistoryState;
    onChange?: (components: PageComponent[]) => void;
    onSaveShortcut?: () => void;
    onTogglePreview?: () => void;
    onRotateDevice?: (direction: "left" | "right") => void;
}
export declare function usePageBuilderState({ page, history, onChange, onSaveShortcut, onTogglePreview, onRotateDevice, }: Params): UsePageBuilderStateResult;
export default usePageBuilderState;
//# sourceMappingURL=usePageBuilderState.d.ts.map

import { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import type { PageComponent } from "@acme/types";
import type { Action } from "./actions";
import type { UsePageBuilderDnDResult } from "./types";
interface Params {
    components: PageComponent[];
    dispatch: (action: Action) => void;
    defaults: Record<string, Partial<PageComponent>>;
    containerTypes: string[];
    selectId: (id: string) => void;
    gridSize?: number;
    canvasRef?: React.RefObject<HTMLDivElement | null>;
    setSnapPosition?: (x: number | null) => void;
}
export declare function usePageBuilderDnD({ components, dispatch, defaults, containerTypes, selectId, gridSize, canvasRef, setSnapPosition, }: Params): UsePageBuilderDnDResult;
export default usePageBuilderDnD;
//# sourceMappingURL=usePageBuilderDnD.d.ts.map
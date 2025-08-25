import { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import type { PageComponent } from "@acme/types";
import type { Action } from "../state";
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
export declare function usePageBuilderDnD({ components, dispatch, defaults, containerTypes, selectId, gridSize, canvasRef, setSnapPosition, }: Params): {
    sensors: import("@dnd-kit/core").SensorDescriptor<import("@dnd-kit/core").SensorOptions>[];
    handleDragStart: (ev: DragStartEvent) => void;
    handleDragMove: (ev: DragMoveEvent) => void;
    handleDragEnd: (ev: DragEndEvent) => void;
    insertIndex: number | null;
    activeType: string | null;
    dndContext: {
        sensors: import("@dnd-kit/core").SensorDescriptor<import("@dnd-kit/core").SensorOptions>[];
        collisionDetection: import("@dnd-kit/core").CollisionDetection;
        onDragStart: (ev: DragStartEvent) => void;
        onDragMove: (ev: DragMoveEvent) => void;
        onDragEnd: (ev: DragEndEvent) => void;
    };
};
export default usePageBuilderDnD;
//# sourceMappingURL=usePageBuilderDnD.d.ts.map
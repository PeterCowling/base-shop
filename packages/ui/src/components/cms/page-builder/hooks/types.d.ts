import type { DragEndEvent, DragMoveEvent, DragStartEvent, SensorDescriptor } from "@dnd-kit/core";
import type { PageComponent, HistoryState } from "@acme/types";
import type { DragEvent } from "react";
import type { UploadProgress } from "../../../../hooks/useFileUpload";
import type { Action } from "./actions";
import type { ComponentsSelector, GridColsSelector } from "./selectors";
export interface UseFileDropResult {
    dragOver: boolean;
    setDragOver: (v: boolean) => void;
    handleFileDrop: (ev: DragEvent<HTMLDivElement>) => void;
    progress: UploadProgress | null;
    isValid: boolean | null;
}
export interface UsePageBuilderDnDResult {
    sensors: SensorDescriptor<any>[];
    handleDragStart: (ev: DragStartEvent) => void;
    handleDragMove: (ev: DragMoveEvent) => void;
    handleDragEnd: (ev: DragEndEvent) => void;
    insertIndex: number | null;
    activeType: string | null;
}
export interface UsePageBuilderStateResult {
    state: HistoryState;
    components: ReturnType<ComponentsSelector>;
    dispatch: (action: Action) => void;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    gridCols: ReturnType<GridColsSelector>;
    setGridCols: (n: number) => void;
    liveMessage: string;
    storageKey: string;
    clearHistory: () => void;
}
export interface UseViewportResult {
    canvasWidth: number;
    canvasHeight: number;
    scale: number;
    viewportStyle: React.CSSProperties;
    frameClass: {
        desktop: string;
        tablet: string;
        mobile: string;
    };
}
//# sourceMappingURL=types.d.ts.map

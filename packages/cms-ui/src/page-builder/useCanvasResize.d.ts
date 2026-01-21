import type { ResizeAction } from "./state/layout";
interface Options {
    componentId: string;
    widthKey: string;
    heightKey: string;
    widthVal?: string;
    heightVal?: string;
    dispatch: React.Dispatch<ResizeAction>;
    gridEnabled?: boolean;
    gridCols: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    disabled?: boolean;
}
export default function useCanvasResize({ componentId, widthKey, heightKey, widthVal, heightVal, dispatch, gridEnabled, gridCols, containerRef, disabled, }: Options): {
    readonly startResize: (e: React.PointerEvent) => void;
    readonly guides: import("./useGuides").Guides;
    readonly distances: {
        x: number | null;
        y: number | null;
    };
    readonly snapping: boolean;
    readonly resizing: boolean;
    readonly width: number;
    readonly height: number;
    readonly left: number;
    readonly top: number;
};
export {};
//# sourceMappingURL=useCanvasResize.d.ts.map

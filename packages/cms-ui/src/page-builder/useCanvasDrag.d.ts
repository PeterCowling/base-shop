import type { Action } from "./state";
interface Options {
    componentId: string;
    dispatch: React.Dispatch<Action>;
    gridEnabled?: boolean;
    gridCols: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    disabled?: boolean;
}
export default function useCanvasDrag({ componentId, dispatch, gridEnabled, gridCols, containerRef, disabled, }: Options): {
    readonly startDrag: (e: React.PointerEvent) => void;
    readonly guides: import("./useGuides").Guides;
    readonly distances: {
        x: number | null;
        y: number | null;
    };
    readonly snapping: boolean;
    readonly moving: boolean;
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
};
export {};
//# sourceMappingURL=useCanvasDrag.d.ts.map
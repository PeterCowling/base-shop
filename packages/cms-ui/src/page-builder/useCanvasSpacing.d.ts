import type { ResizeAction } from "./state/layout";
interface Options {
    componentId: string;
    marginKey: string;
    paddingKey: string;
    marginVal?: string;
    paddingVal?: string;
    dispatch: React.Dispatch<ResizeAction>;
    containerRef: React.RefObject<HTMLDivElement | null>;
}
type SpacingType = "margin" | "padding";
type SpacingSide = "top" | "right" | "bottom" | "left";
interface Overlay {
    type: SpacingType;
    side: SpacingSide;
    top: number;
    left: number;
    width: number;
    height: number;
}
export default function useCanvasSpacing({ componentId, marginKey, paddingKey, marginVal, paddingVal, dispatch, containerRef, }: Options): {
    readonly startSpacing: (e: React.PointerEvent, type: SpacingType, side: SpacingSide) => void;
    readonly overlay: Overlay | null;
};
export {};
//# sourceMappingURL=useCanvasSpacing.d.ts.map

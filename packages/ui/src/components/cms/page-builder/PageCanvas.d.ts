import type { CSSProperties, DragEvent } from "react";
import type { PageComponent } from "@acme/types";
import type { Locale } from "@acme/i18n/locales";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";
interface Props {
    components: PageComponent[];
    selectedId?: string | null;
    onSelectId?: (id: string | null) => void;
    canvasRef?: React.RefObject<HTMLDivElement | null>;
    dragOver?: boolean;
    setDragOver?: (v: boolean) => void;
    onFileDrop?: (e: DragEvent<HTMLDivElement>) => void;
    insertIndex?: number | null;
    dispatch?: (action: Action) => void;
    locale: Locale;
    containerStyle: CSSProperties;
    showGrid?: boolean;
    gridCols?: number;
    viewport: "desktop" | "tablet" | "mobile";
    snapPosition?: number | null;
    device?: DevicePreset;
    preview?: boolean;
}
declare const PageCanvas: ({ components, selectedId, onSelectId, canvasRef, dragOver, setDragOver, onFileDrop, insertIndex, dispatch, locale, containerStyle, showGrid, gridCols, viewport, snapPosition, device, preview, }: Props) => import("react/jsx-runtime").JSX.Element;
export default PageCanvas;
//# sourceMappingURL=PageCanvas.d.ts.map
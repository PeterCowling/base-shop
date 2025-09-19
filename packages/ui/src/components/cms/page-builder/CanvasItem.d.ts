import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";
type Props = {
    component: PageComponent;
    index: number;
    parentId: string | undefined;
    selectedIds: string[];
    onSelect: (id: string, e?: React.MouseEvent) => void;
    onRemove: () => void;
    dispatch: React.Dispatch<Action>;
    locale: Locale;
    gridEnabled?: boolean;
    gridCols: number;
    viewport: "desktop" | "tablet" | "mobile";
    device?: DevicePreset;
};
declare const CanvasItem: import("react").NamedExoticComponent<Props>;
export type { Props as CanvasItemProps };
export default CanvasItem;
//# sourceMappingURL=CanvasItem.d.ts.map

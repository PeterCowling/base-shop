import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import type { Action } from "./state";
import type { DevicePreset } from "../../../utils/devicePresets";
type Props = {
    component: PageComponent;
    index: number;
    parentId: string | undefined;
    selectedId: string | null;
    onSelectId: (id: string) => void;
    onRemove: () => void;
    dispatch: React.Dispatch<Action>;
    locale: Locale;
    gridEnabled?: boolean;
    gridCols: number;
    viewport: "desktop" | "tablet" | "mobile";
    device?: DevicePreset;
};
declare const CanvasItem: import("react").NamedExoticComponent<Props>;
export default CanvasItem;
//# sourceMappingURL=CanvasItem.d.ts.map
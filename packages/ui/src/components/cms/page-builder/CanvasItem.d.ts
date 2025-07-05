import type { Locale } from "@/i18n/locales";
import type { PageComponent } from "@types";
import type { Action } from "../PageBuilder";
declare const CanvasItem: import("react").NamedExoticComponent<{
    component: PageComponent;
    index: number;
    onRemove: () => void;
    selected: boolean;
    onSelect: () => void;
    dispatch: React.Dispatch<Action>;
    locale: Locale;
}>;
export default CanvasItem;
//# sourceMappingURL=CanvasItem.d.ts.map
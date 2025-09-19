import type { Locale } from "@acme/i18n/locales";
import type { TextComponent as BaseTextComponent } from "@acme/types";
import type { Action } from "./state";
type TextComponent = BaseTextComponent & {
    text?: string | Record<string, string>;
    [key: string]: unknown;
};
declare const TextBlock: import("react").NamedExoticComponent<{
    component: TextComponent;
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
}>;
export default TextBlock;
//# sourceMappingURL=TextBlock.d.ts.map

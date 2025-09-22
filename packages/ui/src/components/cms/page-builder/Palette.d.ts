import type { PageComponent } from "@acme/types";
import type { ComponentType } from "./defaults";
interface PaletteProps {
    onAdd: (type: ComponentType, initializer?: Partial<PageComponent>) => void;
}
declare const Palette: import("react").NamedExoticComponent<PaletteProps>;
export default Palette;
//# sourceMappingURL=Palette.d.ts.map

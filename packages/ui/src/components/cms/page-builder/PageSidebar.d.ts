import type { PageComponent } from "@acme/types";
import type { Action } from "./state";
interface Props {
    components: PageComponent[];
    selectedIds: string[];
    onSelectIds: (ids: string[]) => void;
    dispatch: (action: Action) => void;
}
declare const PageSidebar: ({ components, selectedIds, onSelectIds, dispatch }: Props) => import("react/jsx-runtime").JSX.Element;
export default PageSidebar;
//# sourceMappingURL=PageSidebar.d.ts.map

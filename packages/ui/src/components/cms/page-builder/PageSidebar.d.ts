import type { PageComponent } from "@acme/types";
import type { Action } from "./state";
interface Props {
    components: PageComponent[];
    selectedId: string | null;
    dispatch: (action: Action) => void;
}
declare const PageSidebar: ({ components, selectedId, dispatch }: Props) => import("react/jsx-runtime").JSX.Element;
export default PageSidebar;
//# sourceMappingURL=PageSidebar.d.ts.map
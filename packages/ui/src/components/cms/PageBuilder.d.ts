import type { Page, PageComponent } from "@types";
import type { CSSProperties } from "react";
import { z } from "zod";
interface Props {
    page: Page;
    onSave: (fd: FormData) => Promise<unknown>;
    onPublish: (fd: FormData) => Promise<unknown>;
    onChange?: (components: PageComponent[]) => void;
    style?: CSSProperties;
}
export interface HistoryState {
    past: PageComponent[][];
    present: PageComponent[];
    future: PageComponent[][];
}
/**
 *  Build → default → cast; the cast is safe because the default value
 *  fully satisfies the `HistoryState` contract.
 */
export declare const historyStateSchema: z.ZodType<HistoryState>;
type ChangeAction = {
    type: "add";
    component: PageComponent;
} | {
    type: "move";
    from: number;
    to: number;
} | {
    type: "remove";
    id: string;
} | {
    type: "update";
    id: string;
    patch: Partial<PageComponent>;
} | {
    type: "resize";
    id: string;
    width?: string;
    height?: string;
    left?: string;
    top?: string;
} | {
    type: "set";
    components: PageComponent[];
};
export type Action = ChangeAction | {
    type: "undo";
} | {
    type: "redo";
};
declare const PageBuilder: import("react").NamedExoticComponent<Props>;
export default PageBuilder;
//# sourceMappingURL=PageBuilder.d.ts.map
import type { CSSProperties } from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
interface Props {
    page: Page;
    history?: HistoryState;
    onSave: (fd: FormData) => Promise<unknown>;
    onPublish: (fd: FormData) => Promise<unknown>;
    saving?: boolean;
    publishing?: boolean;
    saveError?: string | null;
    publishError?: string | null;
    onChange?: (components: PageComponent[]) => void;
    style?: CSSProperties;
}
declare const PageBuilder: import("react").NamedExoticComponent<Props>;
export default PageBuilder;
//# sourceMappingURL=PageBuilder.d.ts.map
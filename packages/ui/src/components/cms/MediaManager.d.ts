import { ReactElement } from "react";
import type { MediaItem } from "@acme/types";
interface Props {
    shop: string;
    initialFiles: MediaItem[];
    /**
     * Removes a media item on the server.
     * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
     */
    onDelete: (shop: string, src: string) => void | Promise<void>;
    uploaderTargetId?: string;
}
declare function MediaManagerBase({
    shop,
    initialFiles,
    onDelete,
    uploaderTargetId,
}: Props): ReactElement;
declare const _default: import("react").MemoExoticComponent<typeof MediaManagerBase>;
export default _default;

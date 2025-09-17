import { ReactElement } from "react";
import type { MediaItem } from "@acme/types";
type UpdateMetadataFields = {
    title?: string | null;
    altText?: string | null;
    tags?: string[] | null;
};
interface Props {
    shop: string;
    initialFiles: MediaItem[];
    /**
     * Removes a media item on the server.
     * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
     */
    onDelete: (shop: string, src: string) => void | Promise<void>;
    /**
     * Persists metadata updates for a media item.
     */
    onMetadataUpdate: (shop: string, src: string, fields: UpdateMetadataFields) => Promise<MediaItem>;
}
declare function MediaManagerBase({ shop, initialFiles, onDelete, onMetadataUpdate, }: Props): ReactElement;
declare const _default: import("react").MemoExoticComponent<typeof MediaManagerBase>;
export default _default;

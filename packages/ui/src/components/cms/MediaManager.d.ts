import { ReactElement } from "react";
import type { MediaItem } from "@acme/types";
interface MetadataUpdates {
    title?: string | null;
    altText?: string | null;
    description?: string | null;
    tags?: string[] | null;
}
interface Props {
    shop: string;
    initialFiles: MediaItem[];
    /**
     * Removes a media item on the server.
     * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
     */
    onDelete: (shop: string, src: string) => void | Promise<void>;
    /**
     * Optionally updates metadata for a media item.
     */
    onUpdateMetadata?: (shop: string, src: string, updates: MetadataUpdates) => Promise<MediaItem> | MediaItem;
}
declare function MediaManagerBase({ shop, initialFiles, onDelete, onUpdateMetadata, }: Props): ReactElement;
declare const _default: import("react").MemoExoticComponent<typeof MediaManagerBase>;
export default _default;

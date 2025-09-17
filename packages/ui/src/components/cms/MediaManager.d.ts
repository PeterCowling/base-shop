import { ReactElement } from "react";
import type { MediaItem } from "@acme/types";
type MetadataUpdateFields = {
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
    onMetadataUpdate?: (
        shop: string,
        src: string,
        fields: MetadataUpdateFields
    ) => MediaItem | Promise<MediaItem>;
}
declare function MediaManagerBase({ shop, initialFiles, onDelete, }: Props): ReactElement;
declare const _default: import("react").MemoExoticComponent<typeof MediaManagerBase>;
export default _default;

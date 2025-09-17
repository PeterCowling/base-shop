import type { MediaItem } from "@acme/types";
interface Props {
    shop: string;
    initialFiles: MediaItem[];
    /**
     * Removes a media item on the server.
     * Implemented in – and supplied by – the host application (e.g. `apps/cms`).
     */
    onDelete: (shop: string, src: string) => void | Promise<void>;
}
export interface MediaManagerHandle {
    focusUploader: () => void;
}
declare const _default: import("react").MemoExoticComponent<import("react").ForwardRefExoticComponent<Props & import("react").RefAttributes<MediaManagerHandle>>>;
export default _default;

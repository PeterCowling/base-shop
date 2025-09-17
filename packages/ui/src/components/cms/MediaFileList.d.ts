import type { MediaItem } from "@acme/types";
type WithUrl = MediaItem & {
    url: string;
};
interface Props {
    /** List of files already filtered by the parent component */
    files: WithUrl[];
    shop: string;
    onDelete: (url: string) => void;
    onReplace: (oldUrl: string, item: MediaItem) => void;
    onSelect?: (item: WithUrl | null) => void;
    onBulkToggle?: (item: WithUrl, selected: boolean) => void;
    selectionEnabled?: boolean;
    isItemSelected?: (item: WithUrl) => boolean;
    isDeleting?: (item: WithUrl) => boolean;
    isReplacing?: (item: WithUrl) => boolean;
}
export default function MediaFileList({ files, shop, onDelete, onReplace, onSelect, onBulkToggle, selectionEnabled, isItemSelected, isDeleting, isReplacing, }: Props): import("react/jsx-runtime").JSX.Element;
export {};

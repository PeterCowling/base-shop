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
    onSelect?: (item: WithUrl) => void;
    onOpenDetails?: (item: WithUrl) => void;
    onBulkToggle?: (item: WithUrl, selected: boolean) => void;
    selectionEnabled?: boolean;
    isItemSelected?: (item: WithUrl) => boolean;
}
export default function MediaFileList({ files, shop, onDelete, onReplace, onSelect, onOpenDetails, onBulkToggle, selectionEnabled, isItemSelected, }: Props): import("react/jsx-runtime").JSX.Element;
export {};

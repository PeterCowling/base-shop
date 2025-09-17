import type { MediaItem } from "@acme/types";
type WithUrl = MediaItem & {
    url: string;
};
interface Props {
    /** List of files already filtered by the parent component */
    files: WithUrl[];
    shop: string;
    onDelete: (url: string) => Promise<void> | void;
    onReplace: (oldUrl: string) => void;
    onReplaceSuccess?: (oldUrl: string, item: MediaItem) => void;
    onReplaceError?: (oldUrl: string, error: Error) => void;
    onSelect?: (item: WithUrl) => void;
    onOpenDetails?: (item: WithUrl) => void;
    onBulkToggle?: (item: WithUrl, selected: boolean) => void;
    selectionEnabled?: boolean;
    isItemSelected?: (item: WithUrl) => boolean;
    isDeleting?: (url: string) => boolean;
    isReplacing?: (url: string) => boolean;
}
export default function MediaFileList({ files, shop, onDelete, onReplace, onReplaceSuccess, onReplaceError, onSelect, onOpenDetails, onBulkToggle, selectionEnabled, isItemSelected, isDeleting, isReplacing, }: Props): import("react/jsx-runtime").JSX.Element;
export {};

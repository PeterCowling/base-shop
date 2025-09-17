import type { MediaItem } from "@acme/types";
import { ReactElement } from "react";
type WithUrl = MediaItem & {
    url: string;
};
interface LibraryProps {
    files: WithUrl[];
    shop: string;
    onDelete: (url: string) => void;
    onReplace: (oldUrl: string, item: MediaItem) => void;
    onSelect?: (item: WithUrl | null) => void;
    onBulkToggle?: (item: WithUrl, selected: boolean) => void;
    selectionEnabled?: boolean;
    isItemSelected?: (item: WithUrl) => boolean;
    selectedUrl?: string;
    isDeleting?: (item: WithUrl) => boolean;
    isReplacing?: (item: WithUrl) => boolean;
    emptyLibraryMessage?: string;
    emptyResultsMessage?: string;
}
export default function Library({ files, shop, onDelete, onReplace, onSelect, onBulkToggle, selectionEnabled, isItemSelected, selectedUrl, isDeleting, isReplacing, emptyLibraryMessage, emptyResultsMessage, }: LibraryProps): ReactElement;
export {};

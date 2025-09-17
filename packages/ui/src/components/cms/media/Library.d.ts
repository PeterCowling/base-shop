import type { MediaItem } from "@acme/types";
import { ReactElement } from "react";
type WithUrl = MediaItem & {
    url: string;
};
interface LibraryProps {
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
    selectedUrl?: string | null;
    isDeleting?: (url: string) => boolean;
    isReplacing?: (url: string) => boolean;
    emptyLibraryMessage?: string;
    emptyResultsMessage?: string;
}
export default function Library({ files, shop, onDelete, onReplace, onReplaceSuccess, onReplaceError, onSelect, onOpenDetails, onBulkToggle, selectionEnabled, isItemSelected, selectedUrl, isDeleting, isReplacing, emptyLibraryMessage, emptyResultsMessage, }: LibraryProps): ReactElement;
export {};

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
    onSelect?: (item: WithUrl) => void;
    onOpenDetails?: (item: WithUrl) => void;
    onBulkToggle?: (item: WithUrl, selected: boolean) => void;
    selectionEnabled?: boolean;
    isItemSelected?: (item: WithUrl) => boolean;
    emptyLibraryMessage?: string;
    emptyResultsMessage?: string;
}
export default function Library({ files, shop, onDelete, onReplace, onSelect, onOpenDetails, onBulkToggle, selectionEnabled, isItemSelected, emptyLibraryMessage, emptyResultsMessage, }: LibraryProps): ReactElement;
export {};

import type { MediaItem } from "@acme/types";
interface Props {
    /**
     * The media item to render.  The generic {@link MediaItem} type marks the
     * `url` property as optional, but this component relies on it being present
     * (we can't display or replace a file without a URL).  Narrow the type here
     * to guarantee that `url` is a defined string throughout the component.
     */
    item: MediaItem & {
        url: string;
    };
    shop: string;
    onDelete: (url: string) => Promise<void> | void;
    onReplace: (oldUrl: string) => void;
    onReplaceSuccess?: (oldUrl: string, item: MediaItem) => void;
    onReplaceError?: (oldUrl: string, error: Error) => void;
    onSelect?: (item: MediaItem & {
        url: string;
    }) => void;
    onOpenDetails?: (item: MediaItem & {
        url: string;
    }) => void;
    onBulkToggle?: (item: MediaItem & {
        url: string;
    }, selected: boolean) => void;
    selectionEnabled?: boolean;
    selected?: boolean;
    isDeleting?: boolean;
    isReplacing?: boolean;
}
export default function MediaFileItem({ item, shop, onDelete, onReplace, onReplaceSuccess, onReplaceError, onSelect, onOpenDetails, onBulkToggle, selectionEnabled, selected, isDeleting, isReplacing, }: Props): import("react/jsx-runtime").JSX.Element;
export {};

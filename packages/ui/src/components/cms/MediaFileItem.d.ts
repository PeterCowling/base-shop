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
    onDelete: (url: string) => void;
    onReplace: (oldUrl: string, item: MediaItem) => void;
    onSelect?: (item: MediaItem & {
        url: string;
    } | null) => void;
    onBulkToggle?: (item: MediaItem & {
        url: string;
    }, selected: boolean) => void;
    selectionEnabled?: boolean;
    selected?: boolean;
    deleting?: boolean;
    replacing?: boolean;
    disabled?: boolean;
    onReplaceSuccess?: (newItem: MediaItem) => void;
    onReplaceError?: (message: string) => void;
}
export default function MediaFileItem({ item, shop, onDelete, onReplace, onSelect, onBulkToggle, selectionEnabled, selected, deleting, replacing, disabled, onReplaceSuccess, onReplaceError, }: Props): import("react/jsx-runtime").JSX.Element;
export {};

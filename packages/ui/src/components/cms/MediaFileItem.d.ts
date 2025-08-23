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
}
export default function MediaFileItem({ item, shop, onDelete, onReplace, }: Props): import("react/jsx-runtime").JSX.Element;
export {};

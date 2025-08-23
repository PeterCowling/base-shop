import type { MediaItem } from "@acme/types";
interface Props {
    /** List of files already filtered by the parent component */
    files: MediaItem[];
    shop: string;
    onDelete: (url: string) => void;
    onReplace: (oldUrl: string, item: MediaItem) => void;
}
export default function MediaFileList({ files, shop, onDelete, onReplace, }: Props): import("react/jsx-runtime").JSX.Element;
export {};

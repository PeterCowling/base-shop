import type { MediaItem } from "@acme/types";
import { ReactElement } from "react";
interface LibraryProps {
    files: MediaItem[];
    shop: string;
    onDelete: (url: string) => void;
    onReplace: (oldUrl: string, item: MediaItem) => void;
}
export default function Library({ files, shop, onDelete, onReplace, }: LibraryProps): ReactElement;
export {};

/// <reference types="react" />
import type { MediaItem } from "@types";
interface Props {
    files: MediaItem[];
    onDelete: (url: string) => void;
}
export default function MediaFileList({ files, onDelete }: Props): import("react").JSX.Element;
export {};

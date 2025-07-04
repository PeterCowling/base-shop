/// <reference types="react" />
import type { MediaItem } from "@types";
interface Props {
    item: MediaItem;
    onDelete: (url: string) => void;
}
export default function MediaFileItem({ item, onDelete }: Props): import("react").JSX.Element;
export {};

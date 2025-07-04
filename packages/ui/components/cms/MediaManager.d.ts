/// <reference types="react" />
import type { MediaItem } from "@types";
interface Props {
    shop: string;
    initialFiles: MediaItem[];
}
export default function MediaManager({ shop, initialFiles }: Props): import("react").JSX.Element;
export {};

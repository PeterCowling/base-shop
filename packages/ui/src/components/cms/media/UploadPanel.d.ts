import type { MediaItem } from "@acme/types";
import { ReactElement, Ref } from "react";
interface UploadPanelProps {
    shop: string;
    onUploaded: (item: MediaItem) => void;
    focusRef?: Ref<HTMLDivElement>;
}
export default function UploadPanel({ shop, onUploaded, focusRef }: UploadPanelProps): ReactElement;
export {};

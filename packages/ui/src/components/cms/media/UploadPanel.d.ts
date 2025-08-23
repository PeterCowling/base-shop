import type { MediaItem } from "@acme/types";
import { ReactElement } from "react";
interface UploadPanelProps {
    shop: string;
    onUploaded: (item: MediaItem) => void;
}
export default function UploadPanel({ shop, onUploaded }: UploadPanelProps): ReactElement;
export {};

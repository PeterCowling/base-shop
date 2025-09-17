import type { MediaItem } from "@acme/types";
import { ReactElement } from "react";
interface UploadPanelProps {
    shop: string;
    onUploaded: (item: MediaItem) => void;
    onUploadError?: (message: string) => void;
}
export default function UploadPanel({ shop, onUploaded, onUploadError }: UploadPanelProps): ReactElement;
export {};

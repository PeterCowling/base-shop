import type { MediaItem } from "@acme/types";
import { ReactElement } from "react";
interface UploadPanelProps {
    shop: string;
    onUploaded: (item: MediaItem) => void;
    focusTargetId?: string;
    onUploadError?: (message: string) => void;
}
export default function UploadPanel({ shop, onUploaded, focusTargetId, onUploadError, }: UploadPanelProps): ReactElement;
export {};

import type { ImageOrientation, MediaItem } from "@types";
import type { ChangeEvent, DragEvent, RefObject } from "react";
export interface UseMediaUploadOptions {
    shop: string;
    requiredOrientation: ImageOrientation;
    onUploaded?: (item: MediaItem) => void;
}
export interface UploadProgress {
    done: number;
    total: number;
}
export interface UseMediaUploadResult {
    pendingFile: File | null;
    altText: string;
    setAltText: (text: string) => void;
    actual: ImageOrientation | null;
    isValid: boolean | null;
    progress: UploadProgress | null;
    error: string | undefined;
    inputRef: RefObject<HTMLInputElement | null>;
    openFileDialog: () => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleUpload: () => Promise<void>;
}
export declare function useMediaUpload({ shop, requiredOrientation, onUploaded, }: UseMediaUploadOptions): UseMediaUploadResult;

import type { ChangeEvent, DragEvent, ReactElement, RefObject } from "react";
import type { ImageOrientation, MediaItem } from "@types";
export interface UseMediaUploadOptions {
    /** Shop slug the media belongs to (`/data/shops/<shop>/media`) */
    shop: string;
    /** Expected orientation of the uploaded image (e.g. `"landscape"`) */
    requiredOrientation: ImageOrientation;
    /** Callback fired when the upload succeeds */
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
    handleUpload: () => Promise<void>;
    inputRef: RefObject<HTMLInputElement | null>;
    openFileDialog: () => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
    uploader: ReactElement;
}
export declare function useImageUpload(options: UseMediaUploadOptions): UseMediaUploadResult;
export { useImageUpload as useMediaUpload };
export default useImageUpload;
//# sourceMappingURL=useMediaUpload.d.ts.map
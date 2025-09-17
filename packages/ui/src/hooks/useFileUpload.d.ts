import type { ChangeEvent, DragEvent, ReactElement, RefObject } from "react";
import type { ImageOrientation, MediaItem } from "@acme/types";
export interface UseFileUploadOptions {
    /** Shop slug the media belongs to (`/data/shops/<shop>/media`) */
    shop: string;
    /** Expected orientation of the uploaded image (e.g. `"landscape"`) */
    requiredOrientation: ImageOrientation;
    /** Callback fired when the upload succeeds */
    onUploaded?: (item: MediaItem) => void;
    /** Callback fired when the upload fails */
    onError?: (error: Error) => void;
}
export interface UploadProgress {
    done: number;
    total: number;
}
export interface UseFileUploadResult {
    pendingFile: File | null;
    altText: string;
    setAltText: (text: string) => void;
    /** Comma separated list of tags */
    tags: string;
    setTags: (tags: string) => void;
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
export declare function useFileUpload(options: UseFileUploadOptions): UseFileUploadResult;
export { useFileUpload as useMediaUpload };
export default useFileUpload;
export type { UseFileUploadOptions as UseMediaUploadOptions, UseFileUploadResult as UseMediaUploadResult, };
//# sourceMappingURL=useFileUpload.d.ts.map

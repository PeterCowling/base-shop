import type { ImageOrientation } from "@types";
export interface UseImageUploadResult {
    file: File | null;
    setFile: (f: File | null) => void;
    uploader: JSX.Element;
}
export declare function useImageUpload(requiredOrientation: ImageOrientation): UseImageUploadResult;

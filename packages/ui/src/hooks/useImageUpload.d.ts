import type { ImageOrientation } from "@types";
import type { ReactElement } from "react";
/**
 * Return type for useImageUpload
 */
export interface UseImageUploadResult {
    /** The currently selected file, or null if none */
    file: File | null;
    /** Setter to update the selected file */
    setFile: (f: File | null) => void;
    /** Memoised uploader component ready to render */
    uploader: ReactElement;
}
/**
 * Provides image–upload state plus a ready-made uploader component.
 *
 * @param requiredOrientation – Expected orientation of the uploaded image
 */
export declare function useImageUpload(requiredOrientation: ImageOrientation): UseImageUploadResult;
//# sourceMappingURL=useImageUpload.d.ts.map
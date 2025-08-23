import type { UseFileUploadOptions, UseFileUploadResult } from "./useFileUpload";
export interface UseMediaUploadResult extends UseFileUploadResult {
    /** Data URL for a preview thumbnail of the selected file */
    thumbnail: string | null;
}
export declare function useMediaUpload(options: UseFileUploadOptions): UseMediaUploadResult;
export type { UseFileUploadOptions as UseMediaUploadOptions };
export default useMediaUpload;

import type { ImageOrientation } from "@types";
export interface ImageOrientationValidationResult {
    actual: ImageOrientation | null;
    isValid: boolean | null;
}
export declare function useImageOrientationValidation(file: File | null, required: ImageOrientation): ImageOrientationValidationResult;
//# sourceMappingURL=useImageOrientationValidation.d.ts.map
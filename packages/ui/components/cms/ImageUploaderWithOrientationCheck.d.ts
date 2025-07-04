/// <reference types="react" />
import type { ImageOrientation } from "@types";
export interface ImageUploaderWithOrientationCheckProps {
    file: File | null;
    onChange: (file: File | null) => void;
    requiredOrientation: ImageOrientation;
}
declare function ImageUploaderWithOrientationCheckInner({ file, onChange, requiredOrientation, }: ImageUploaderWithOrientationCheckProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof ImageUploaderWithOrientationCheckInner>;
export default _default;

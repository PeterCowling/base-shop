import type { ImageOrientation } from "@acme/types";
export interface ImageUploaderWithOrientationCheckProps {
    file: File | null;
    onChange: (file: File | null) => void;
    requiredOrientation: ImageOrientation;
}
declare function ImageUploaderWithOrientationCheckInner({ file, onChange, requiredOrientation, }: ImageUploaderWithOrientationCheckProps): import("react/jsx-runtime").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof ImageUploaderWithOrientationCheckInner>;
export default _default;
//# sourceMappingURL=ImageUploaderWithOrientationCheck.d.ts.map
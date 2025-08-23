import { jsx as _jsx } from "react/jsx-runtime";
import ImageUploaderWithOrientationCheck from "../components/cms/ImageUploaderWithOrientationCheck";
import { useMemo, useState } from "react";
/**
 * Provides image–upload state plus a ready-made uploader component.
 *
 * @param requiredOrientation – Expected orientation of the uploaded image
 */
export function useImageUpload(requiredOrientation) {
    const [file, setFile] = useState(null);
    const uploader = useMemo(() => (_jsx(ImageUploaderWithOrientationCheck, { file: file, onChange: setFile, requiredOrientation: requiredOrientation })), [file, requiredOrientation]);
    return { file, setFile, uploader };
}

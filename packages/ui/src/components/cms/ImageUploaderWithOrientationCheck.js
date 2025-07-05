// packages/ui/components/cms/ImageUploaderWithOrientationCheck.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@/components/atoms-shadcn";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import { memo, useCallback } from "react";
const equal = (a, b) => a.file === b.file &&
    a.onChange === b.onChange &&
    a.requiredOrientation === b.requiredOrientation;
function ImageUploaderWithOrientationCheckInner({ file, onChange, requiredOrientation, }) {
    const { actual, isValid } = useImageOrientationValidation(file, requiredOrientation);
    const handleFileChange = useCallback((e) => {
        const nextFile = e.target.files?.[0] ?? null;
        onChange(nextFile);
    }, [onChange]);
    return (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsx(Input, { type: "file", accept: "image/*", onChange: handleFileChange, className: "block w-full cursor-pointer rounded-2xl border p-2" }), file && isValid !== null && (_jsx("p", { className: isValid ? "text-sm text-green-600" : "text-sm text-red-600", children: isValid
                    ? `Image orientation is ${actual}; requirement satisfied.`
                    : `Selected image is ${actual}; please upload a ${requiredOrientation} image.` }))] }));
}
export default memo(ImageUploaderWithOrientationCheckInner, equal);

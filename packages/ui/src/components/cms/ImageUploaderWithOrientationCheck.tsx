// packages/ui/components/cms/ImageUploaderWithOrientationCheck.tsx
"use client";

import { Input } from "@/components/atoms-shadcn";
import type { ImageOrientation } from "@types";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import { memo, useCallback } from "react";

export interface ImageUploaderWithOrientationCheckProps {
  file: File | null;
  onChange: (file: File | null) => void;
  requiredOrientation: ImageOrientation;
}

const equal = (
  a: ImageUploaderWithOrientationCheckProps,
  b: ImageUploaderWithOrientationCheckProps
) =>
  a.file === b.file &&
  a.onChange === b.onChange &&
  a.requiredOrientation === b.requiredOrientation;

function ImageUploaderWithOrientationCheckInner({
  file,
  onChange,
  requiredOrientation,
}: ImageUploaderWithOrientationCheckProps) {
  const { actual, isValid } = useImageOrientationValidation(
    file,
    requiredOrientation
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextFile = e.target.files?.[0] ?? null;
      onChange(nextFile);
    },
    [onChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="block w-full cursor-pointer rounded-2xl border p-2"
      />

      {file && isValid !== null && (
        <p
          className={
            isValid ? "text-sm text-green-600" : "text-sm text-red-600"
          }
        >
          {isValid
            ? `Image orientation is ${actual}; requirement satisfied.`
            : `Selected image is ${actual}; please upload a ${requiredOrientation} image.`}
        </p>
      )}
    </div>
  );
}

export default memo(ImageUploaderWithOrientationCheckInner, equal);

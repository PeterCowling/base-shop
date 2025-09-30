// packages/ui/components/cms/ImageUploaderWithOrientationCheck.tsx
"use client";

import { Input } from "../atoms/shadcn";
import type { ImageOrientation } from "@acme/types";
import { useImageOrientationValidation } from "../../hooks/useImageOrientationValidation";
import { memo, useCallback } from "react";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
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
        className="block w-full cursor-pointer rounded-2xl border p-2" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
      />

      {file && isValid !== null && (
        <p
          className={
            isValid ? "text-sm text-success" : "text-sm text-danger" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
          }
          data-token={isValid ? "--color-success" : "--color-danger" /* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
        >
          {isValid
            ? (t("cms.image.orientation.ok", { actual: actual ?? "" }) as string)
            : (t("cms.image.orientation.bad", {
                actual: actual ?? "",
                required: requiredOrientation,
              }) as string)}
        </p>
      )}
    </div>
  );
}

export default memo(ImageUploaderWithOrientationCheckInner, equal);

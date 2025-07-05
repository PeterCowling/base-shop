import type { ImageOrientation } from "@types";
import { useEffect, useState } from "react";

export interface ImageOrientationValidationResult {
  actual: ImageOrientation | null;
  isValid: boolean | null;
}

export function useImageOrientationValidation(
  file: File | null,
  required: ImageOrientation
): ImageOrientationValidationResult {
  const [actual, setActual] = useState<ImageOrientation | null>(null);

  useEffect(() => {
    if (!file) {
      setActual(null);
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const orientation: ImageOrientation =
        img.width >= img.height ? "landscape" : "portrait";
      setActual(orientation);
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      setActual(null);
      URL.revokeObjectURL(url);
    };

    img.src = url;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run whenever file changes
  }, [file]);

  const isValid = actual === null ? null : actual === required;
  return { actual, isValid };
}

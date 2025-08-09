// src/hooks/useImageUpload.tsx

import type { ImageOrientation } from "@types";
import { ImageUploaderWithOrientationCheck } from "@ui";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";

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
export function useImageUpload(
  requiredOrientation: ImageOrientation
): UseImageUploadResult {
  const [file, setFile] = useState<File | null>(null);

  const uploader = useMemo<ReactElement>(
    () => (
      <ImageUploaderWithOrientationCheck
        file={file}
        onChange={setFile}
        requiredOrientation={requiredOrientation}
      />
    ),
    [file, requiredOrientation]
  );

  return { file, setFile, uploader };
}

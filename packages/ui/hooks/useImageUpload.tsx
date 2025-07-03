import { useState } from "react";
import type { ImageOrientation } from "@types";
import ImageUploaderWithOrientationCheck from "@ui/components/cms/ImageUploaderWithOrientationCheck";

export interface UseImageUploadResult {
  file: File | null;
  setFile: (f: File | null) => void;
  uploader: JSX.Element;
}

export function useImageUpload(
  requiredOrientation: ImageOrientation
): UseImageUploadResult {
  const [file, setFile] = useState<File | null>(null);

  const uploader = (
    <ImageUploaderWithOrientationCheck
      file={file}
      onChange={setFile}
      requiredOrientation={requiredOrientation}
    />
  );

  return { file, setFile, uploader };
}
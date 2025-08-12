import type { ChangeEvent, ReactElement } from "react";
import { useCallback, useMemo, useRef } from "react";

export interface UseFileUploadOptions {
  accept?: string;
  multiple?: boolean;
  onFilesSelected?: (files: FileList) => void;
}

export function useFileUpload(
  options: UseFileUploadOptions = {}
): { uploader: ReactElement } {
  const { accept = "image/*,video/*", multiple = true, onFilesSelected } = options;
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) onFilesSelected?.(e.target.files);
    },
    [onFilesSelected]
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const uploader = useMemo<ReactElement>(
    () => (
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
      />
    ),
    [accept, multiple, handleChange]
  );

  return { uploader };
}

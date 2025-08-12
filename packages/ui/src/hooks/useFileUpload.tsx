// packages/ui/hooks/useFileUpload.tsx
import { useCallback, useRef, type ReactElement } from "react";

export interface UseFileUploadResult {
  uploader: ReactElement;
  open: () => void;
}

export function useFileUpload(onFiles: (files: File[]) => void): UseFileUploadResult {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length) onFiles(files);
      e.target.value = "";
    },
    [onFiles]
  );

  const open = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const uploader = (
    <input
      ref={inputRef}
      type="file"
      accept="image/*,video/*"
      multiple
      className="hidden"
      onChange={handleChange}
    />
  );

  return { uploader, open };
}

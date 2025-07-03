import type { ImageOrientation, MediaItem } from "@types";
import { useCallback, useRef, useState } from "react";
import { useImageOrientationValidation } from "./useImageOrientationValidation";

export interface UseMediaUploadOptions {
  shop: string;
  requiredOrientation: ImageOrientation;
  onUploaded?: (item: MediaItem) => void;
}

export interface UploadProgress {
  done: number;
  total: number;
}

export interface UseMediaUploadResult {
  pendingFile: File | null;
  altText: string;
  setAltText: (text: string) => void;
  actual: ImageOrientation | null;
  isValid: boolean | null;
  progress: UploadProgress | null;
  error: string | undefined;
  inputRef: React.RefObject<HTMLInputElement>;
  openFileDialog: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
}

export function useMediaUpload({
  shop,
  requiredOrientation,
  onUploaded,
}: UseMediaUploadOptions): UseMediaUploadResult {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const { actual, isValid } = useImageOrientationValidation(
    pendingFile,
    requiredOrientation
  );

  const handleUpload = useCallback(async () => {
    if (!pendingFile) return;
    setProgress({ done: 0, total: 1 });
    const fd = new FormData();
    fd.append("file", pendingFile);
    if (altText) fd.append("altText", altText);
    try {
      const res = await fetch(
        `/cms/api/media?shop=${shop}&orientation=${requiredOrientation}`,
        {
          method: "POST",
          body: fd,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      onUploaded?.(data as MediaItem);
      setError(undefined);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
    setProgress(null);
    setPendingFile(null);
    setAltText("");
  }, [pendingFile, altText, shop, onUploaded, requiredOrientation]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setPendingFile(f);
    setAltText("");
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setPendingFile(f);
    setAltText("");
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return {
    pendingFile,
    altText,
    setAltText,
    actual,
    isValid,
    progress,
    error,
    inputRef,
    openFileDialog,
    onDrop,
    onFileChange,
    handleUpload,
  };
}

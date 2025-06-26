// packages/ui/components/cms/MediaManager.tsx
"use client";

import { Input } from "@/components/ui/input";
import { deleteMedia, uploadMedia } from "@cms/actions/media";
import type { ImageOrientation } from "@types";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  shop: string;
  initialFiles: string[];
}

export default function MediaManager({ shop, initialFiles }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string>();
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [progress, setProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDelete = useCallback(
    async (src: string) => {
      /* eslint-disable no-alert -- simple confirmation is fine */
      if (!confirm("Delete this image?")) return;
      await deleteMedia(shop, src);
      setFiles((prev) => prev.filter((f) => f !== src));
    },
    [shop]
  );

  const REQUIRED_ORIENTATION: ImageOrientation = "landscape";
  const { actual, isValid } = useImageOrientationValidation(
    pendingFile,
    REQUIRED_ORIENTATION
  );

  const handleUpload = useCallback(
    async (selected: File[]) => {
      setProgress({ done: 0, total: selected.length });
      for (const file of selected) {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const url = await uploadMedia(shop, fd);
          setFiles((prev) => [url, ...prev]);
          setError(undefined);
        } catch (err) {
          if (err instanceof Error) setError(err.message);
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
      setProgress(null);
    },
    [shop]
  );

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setPendingFile(f);
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setPendingFile(f);
  }, []);

  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  useEffect(() => {
    if (pendingFile && isValid) {
      void handleUpload(pendingFile);
      setPendingFile(null);
    }
  }, [pendingFile, isValid, handleUpload]);

  return (
    <div className="space-y-6">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={openFileDialog}
        className="flex h-32 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 text-sm text-gray-500"
      >
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileChange}
        />
        Drop image here or click to upload
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {progress && (
        <p className="text-sm text-gray-600">
          Uploaded {progress.done}/{progress.total}
        </p>
      )}
      {pendingFile && isValid !== null && (
        <p
          className={
            isValid ? "text-sm text-green-600" : "text-sm text-red-600"
          }
        >
          {isValid
            ? `Image orientation is ${actual}; requirement satisfied.`
            : `Selected image is ${actual}; please upload a ${REQUIRED_ORIENTATION} image.`}
        </p>
      )}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {files.map((src) => (
            <div
              key={src}
              className="relative h-32 w-full overflow-hidden rounded-md border"
            >
              <button
                onClick={() => handleDelete(src)}
                className="absolute top-1 right-1 rounded bg-black/50 px-1.5 text-xs text-white"
              >
                Delete
              </button>
              <Image src={src} alt="media" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

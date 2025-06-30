// packages/ui/components/cms/MediaManager.tsx
"use client";

import { Input } from "@/components/atoms-shadcn";
import { deleteMedia, uploadMedia } from "@cms/actions/media.server";
import type { ImageOrientation, MediaItem } from "@types";
import { useImageOrientationValidation } from "@ui/hooks/useImageOrientationValidation";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface Props {
  shop: string;
  initialFiles: MediaItem[];
}

export default function MediaManager({ shop, initialFiles }: Props) {
  const [files, setFiles] = useState<MediaItem[]>(initialFiles);
  const [error, setError] = useState<string>();
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");

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
      setFiles((prev) => prev.filter((f) => f.url !== src));
    },
    [shop]
  );

  const REQUIRED_ORIENTATION: ImageOrientation = "landscape";
  const { actual, isValid } = useImageOrientationValidation(
    pendingFile,
    REQUIRED_ORIENTATION
  );

  const handleUpload = useCallback(async () => {
    if (!pendingFile) return;
    setProgress({ done: 0, total: 1 });
    const fd = new FormData();
    fd.append("file", pendingFile);
    if (altText) fd.append("altText", altText);
    try {
      const item = await uploadMedia(shop, fd);
      setFiles((prev) => [item, ...prev]);
      setError(undefined);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    }
    setProgress(null);
    setPendingFile(null);
    setAltText("");
  }, [shop, pendingFile, altText]);

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
        <div className="space-y-2">
          <p
            className={
              isValid ? "text-sm text-green-600" : "text-sm text-red-600"
            }
          >
            {isValid
              ? `Image orientation is ${actual}; requirement satisfied.`
              : `Selected image is ${actual}; please upload a ${REQUIRED_ORIENTATION} image.`}
          </p>
          {isValid && (
            <div className="flex gap-2">
              <Input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Alt text"
                className="flex-1"
              />
              <button
                onClick={handleUpload}
                className="rounded bg-blue-600 px-2 text-sm text-white"
              >
                Upload
              </button>
            </div>
          )}
        </div>
      )}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {files.map((item) => (
            <div
              key={item.url}
              className="relative h-32 w-full overflow-hidden rounded-md border"
            >
              <button
                onClick={() => handleDelete(item.url)}
                className="absolute top-1 right-1 rounded bg-black/50 px-1.5 text-xs text-white"
              >
                Delete
              </button>
              <Image
                src={item.url}
                alt={item.altText || "media"}
                fill
                className="object-cover"
              />
              {item.altText && (
                <p className="absolute bottom-1 left-1 bg-black/50 px-1 text-xs text-white">
                  {item.altText}
                </p>
              )}{" "}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

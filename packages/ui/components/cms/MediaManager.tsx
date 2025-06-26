// packages/ui/components/cms/MediaManager.tsx
"use client";

import { Input } from "@/components/ui/input";
import { uploadMedia } from "@cms/actions/media";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";

interface Props {
  shop: string;
  initialFiles: string[];
}

export default function MediaManager({ shop, initialFiles }: Props) {
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const url = await uploadMedia(shop, fd);
        setFiles((prev) => [url, ...prev]);
        setError(undefined);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      }
    },
    [shop]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) void handleUpload(f);
    },
    [handleUpload]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void handleUpload(f);
    },
    [handleUpload]
  );

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
          className="hidden"
          onChange={onFileChange}
        />
        Drop image here or click to upload
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {files.map((src) => (
            <div
              key={src}
              className="relative h-32 w-full overflow-hidden rounded-md border"
            >
              <Image src={src} alt="media" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

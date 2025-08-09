// packages/ui/src/components/cms/page-builder/ImagePicker.tsx
"use client";

import type { MediaItem } from "@types";
import { useMediaUpload } from "@ui";
import Image from "next/image";
import { memo, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Input,
} from "../../atoms-shadcn";
import useMediaLibrary from "./useMediaLibrary";

interface Props {
  onSelect: (url: string) => void;
  children: React.ReactNode;
}

function ImagePicker({ onSelect, children }: Props) {
  const [open, setOpen] = useState(false);
  const { media, setMedia, loadMedia, shop } = useMediaLibrary();

  const {
    pendingFile,
    altText,
    setAltText,
    isValid,
    actual,
    inputRef,
    onFileChange,
    handleUpload,
    error,
  } = useMediaUpload({
    shop: shop ?? "",
    requiredOrientation: "landscape",
    onUploaded: (item: MediaItem) => {
      setMedia((m) => [item, ...m]);
    },
  });

  useEffect(() => {
    if (open) void loadMedia();
  }, [open, loadMedia]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl space-y-4">
        <DialogTitle>Select image</DialogTitle>
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="flex-1"
          />
          {pendingFile && isValid && (
            <Button type="button" onClick={handleUpload}>
              Upload
            </Button>
          )}
        </div>
        {pendingFile && isValid && (
          <Input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Alt text"
          />
        )}
        {pendingFile && isValid !== null && (
          <p className="text-sm">
            {isValid
              ? `Image orientation is ${actual}`
              : `Selected image is ${actual}; please upload a landscape image.`}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-auto">
          {media.map((m) => (
            <button
              key={m.url}
              type="button"
              onClick={() => {
                onSelect(m.url);
                setOpen(false);
              }}
              className="relative aspect-square"
            >
              <Image
                src={m.url}
                alt={m.altText || "media"}
                fill
                className="object-cover"
              />
            </button>
          ))}
          {media.length === 0 && (
            <p className="text-muted-foreground col-span-3 text-sm">
              No media found.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(ImagePicker);

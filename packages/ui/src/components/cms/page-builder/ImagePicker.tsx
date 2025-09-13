// packages/ui/src/components/cms/page-builder/ImagePicker.tsx
"use client";

import type { MediaItem } from "@acme/types";
import useFileUpload from "@ui/hooks/useFileUpload";
import Image from "next/image";
import { memo, useEffect, useState, type ChangeEvent } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
} from "../../atoms/shadcn";
import { Loader } from "../../atoms/Loader";
import useMediaLibrary from "./useMediaLibrary";

interface Props {
  onSelect: (url: string) => void;
  children: React.ReactNode;
}

function ImagePicker({ onSelect, children }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { media, setMedia, loadMedia, shop, loading, error: mediaError } =
    useMediaLibrary();

  const {
    pendingFile,
    altText,
    setAltText,
    isValid,
    actual,
    inputRef,
    onFileChange,
    handleUpload,
    error: uploadError,
    progress,
  } = useFileUpload({
    shop: shop ?? "",
    requiredOrientation: "landscape",
    onUploaded: (item: MediaItem) => {
      setMedia((m) => [item, ...m]);
    },
  });

  useEffect(() => {
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [pendingFile]);

  useEffect(() => {
    if (open) {
      setSearch("");
      void loadMedia();
    }
  }, [open, loadMedia]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearch(q);
    void loadMedia(q);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl space-y-4">
        <DialogTitle>Select image</DialogTitle>
        <DialogDescription>
          Choose an existing image or upload a new one.
        </DialogDescription>
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
        {previewUrl && (
          <div className="relative h-32 w-full overflow-hidden rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="preview"
              className="h-full w-full object-cover"
            />
            {progress && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                <Loader className="mb-2" />
                <span className="text-xs">
                  Uploading… {progress.done}/{progress.total}
                </span>
              </div>
            )}
          </div>
        )}
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
        {uploadError && (
          <p className="text-sm text-danger" data-token="--color-danger">
            {uploadError}
          </p>
        )}
        <Input
          value={search}
          onChange={handleSearch}
          placeholder="Search media..."
        />
        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-auto">
          {loading && (
            <div className="col-span-3 flex items-center justify-center">
              <Loader />
            </div>
          )}
          {!loading && mediaError && (
            <p
              className="text-danger col-span-3 text-sm"
              data-token="--color-danger"
            >
              {mediaError}
            </p>
          )}
          {!loading && !mediaError &&
            media
              .filter((m) => m.type === "image")
              .map((m) => (
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
          {!loading &&
            !mediaError &&
            media.filter((m) => m.type === "image").length === 0 && (
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

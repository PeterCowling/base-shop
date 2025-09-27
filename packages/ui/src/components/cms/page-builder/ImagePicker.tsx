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
import { Grid as DSGrid } from "../../atoms/primitives/Grid";
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
      <DialogContent className="w-full space-y-4">
        {/* i18n-exempt -- CMS dialog title */}
        <DialogTitle>Select image</DialogTitle>
        <DialogDescription className="sr-only">
          {/* i18n-exempt -- CMS dialog description for screen readers */}
          Choose an image from the media library
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
              {/* i18n-exempt -- CMS action label */}
              Upload
            </Button>
          )}
        </div>
        {previewUrl && (
          <div className="relative w-full overflow-hidden rounded" data-aspect="16/9">
            <Image
              src={previewUrl}
              alt="preview"
              fill
              className="object-cover"
              unoptimized
            />
            {progress && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                <Loader className="mb-2" />
                <span className="text-xs">
                  {/* i18n-exempt -- temporary upload progress text */}
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
            // i18n-exempt -- field placeholder in CMS
            placeholder="Alt text"
          />
        )}
        {pendingFile && isValid !== null && (
          <p className="text-sm">
            {/* i18n-exempt -- admin validation helper copy */}
            {isValid
              ? `Image orientation is ${actual}`
              : `Selected image is ${actual}; please upload a landscape image.`}
          </p>
        )}
        {uploadError && (
          // eslint-disable-next-line ds/no-hardcoded-copy -- CMS-000: error message comes from server, not user-facing copy to translate
          <p className="text-sm text-danger" data-token="--color-danger">{uploadError}</p>
        )}
        <Input
          value={search}
          onChange={handleSearch}
          // i18n-exempt -- search placeholder in CMS
          placeholder="Search media..."
        />
        {/* Media grid */}
        <div className="max-h-64 overflow-auto">
          <DSGrid cols={3} gap={2}>
            {loading && (
              <div className="col-span-3 flex items-center justify-center">
                <Loader />
              </div>
            )}
            {!loading && mediaError && (
              // eslint-disable-next-line ds/no-hardcoded-copy -- CMS-000: error string from server/logging
              <p className="text-danger col-span-3 text-sm" data-token="--color-danger">{mediaError}</p>
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
                    className="relative aspect-square min-h-10 min-w-10"
                  >
                    <Image src={m.url} alt={m.altText || "media"} fill className="object-cover" />
                  </button>
                ))}
            {!loading && !mediaError && media.filter((m) => m.type === "image").length === 0 && (
              <p className="text-muted-foreground col-span-3 text-sm">
                {/* i18n-exempt -- CMS empty state */}
                No media found.
              </p>
            )}
          </DSGrid>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(ImagePicker);

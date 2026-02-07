// packages/ui/src/components/cms/page-builder/ImagePicker.tsx
"use client";

import { type ChangeEvent, memo, useEffect, useState } from "react";
import Image from "next/image";

import { Loader } from "@acme/design-system/atoms/Loader";
import { Grid as DSGrid } from "@acme/design-system/primitives/Grid";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input,
} from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { MediaItem } from "@acme/types";
import useFileUpload from "@acme/ui/hooks/useFileUpload";

import useMediaLibrary from "./useMediaLibrary";

export interface ImagePickerProps {
  onSelect: (url: string) => void;
  children: React.ReactNode;
}

type TranslationFn = ReturnType<typeof useTranslations>;

interface MediaGridProps {
  loading: boolean;
  mediaError: string | null;
  media: MediaItem[];
  onSelect: (url: string) => void;
  onClose: () => void;
  t: TranslationFn;
  dangerToken: string;
}

function MediaGrid({
  loading,
  mediaError,
  media,
  onSelect,
  onClose,
  t,
  dangerToken,
}: MediaGridProps) {
  const images = media.filter((item) => item.type === "image");

  if (loading) {
    return (
      <div className="col-span-3 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (mediaError) {
    return (
      <p className="text-danger col-span-3 text-sm" data-token={dangerToken}>
        {mediaError}
      </p>
    );
  }

  if (images.length === 0) {
    return (
      <p className="text-muted-foreground col-span-3 text-sm">
        {/* i18n-exempt -- CMS empty state */}
        {t("cms.media.picker.empty")}
      </p>
    );
  }

  return images.map((item) => (
    <button
      key={item.url}
      type="button"
      onClick={() => {
        onSelect(item.url);
        onClose();
      }}
      className="relative aspect-square min-h-11 min-w-11"
    >
      <Image
        src={item.url}
        alt={item.altText || t("cms.media.picker.mediaAltFallback")}
        fill
        className="object-cover"
      />
    </button>
  ));
}

function ImagePicker({ onSelect, children }: ImagePickerProps) {
  const t = useTranslations();
  const dangerToken = "--color-danger";
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

  const orientationLabel = actual ?? "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-full space-y-4">
        <DialogTitle>{t("cms.media.picker.title")}</DialogTitle>
        <DialogDescription className="sr-only">
          {/* i18n-exempt -- CMS dialog description for screen readers */}
          {t("cms.media.picker.description")}
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
              {t("cms.media.picker.upload")}
            </Button>
          )}
        </div>
        {previewUrl && (
          <div className="relative w-full overflow-hidden rounded" data-aspect="16/9">
            <Image
              src={previewUrl}
              alt={t("cms.media.picker.previewAlt")}
              fill
              className="object-cover"
              unoptimized
            />
            {progress && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/50 text-foreground">
                <Loader className="mb-2" />
                <span className="text-xs">
                  {t("cms.media.picker.uploading", { done: progress.done, total: progress.total })}
                </span>
              </div>
            )}
          </div>
        )}
        {pendingFile && isValid && (
          <Input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder={t("cms.media.picker.altPlaceholder")}
          />
        )}
        {pendingFile && isValid !== null && (
          <p className="text-sm">
            {isValid
              ? t("cms.media.picker.orientationValid", { orientation: orientationLabel })
              : t("cms.media.picker.orientationInvalid", { orientation: orientationLabel })}
          </p>
        )}
        {uploadError && (
          <p className="text-sm text-danger" data-token={dangerToken}>{uploadError}</p>
        )}
        <Input
          value={search}
          onChange={handleSearch}
          placeholder={t("cms.media.picker.search.placeholder")}
        />
        {/* Media grid */}
        <div className="max-h-64 overflow-auto">
          <DSGrid cols={3} gap={2}>
            <MediaGrid
              loading={loading}
              mediaError={mediaError ?? null}
              media={media}
              onSelect={onSelect}
              onClose={() => setOpen(false)}
              t={t}
              dangerToken={dangerToken}
            />
          </DSGrid>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(ImagePicker);

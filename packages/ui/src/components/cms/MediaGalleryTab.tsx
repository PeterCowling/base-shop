import { Card, CardContent } from "../atoms/shadcn";
import Image from "next/image";
import { IconButton } from "../atoms";
import { Grid } from "../atoms/primitives";
import type { MediaItem } from "@acme/types";
import { useTranslations } from "@acme/i18n";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Cross2Icon,
  DragHandleDots2Icon,
} from "@radix-ui/react-icons";
import type { ReactNode } from "react";

interface MediaGalleryTabProps {
  uploader: ReactNode;
  media: MediaItem[];
  onMoveMedia: (from: number, to: number) => void;
  onRemoveMedia: (index: number) => void;
}

export default function MediaGalleryTab({
  uploader,
  media,
  onMoveMedia,
  onRemoveMedia,
}: MediaGalleryTabProps) {
  const t = useTranslations();
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] responsive image sizes string
  const GALLERY_IMAGE_SIZES = "(min-width: 1024px) 33vw, 50vw";
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          {uploader}
          {media.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("cms.media.gallery.emptyHelp")}</p>
          )}
          {media.length > 0 && (
            <Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item: MediaItem, index: number) => (
                <div
                  key={item.url}
                  className="group relative overflow-hidden rounded-xl border"
                >
                  {item.type === "image" ? (
                    <div className="relative h-48 w-full" data-aspect="16/9">
                      <Image
                        src={item.url}
                        alt={item.altText || ""}
                        fill
                        className="object-cover"
                        sizes={GALLERY_IMAGE_SIZES}
                      />
                    </div>
                  ) : (
                    <video
                      src={item.url}
                      className="h-48 w-full object-cover"
                      data-aspect="16/9"
                      // Preview video without audio to satisfy a11y rule
                      muted
                      playsInline
                      loop
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-1">
                      <IconButton
                        aria-label={String(t("cms.media.gallery.aria.moveUp", { index: index + 1 }))}
                        onClick={() => onMoveMedia(index, index - 1)}
                        disabled={index === 0}
                        variant="secondary"
                      >
                        <ArrowUpIcon />
                      </IconButton>
                      <IconButton
                        aria-label={String(t("cms.media.gallery.aria.moveDown", { index: index + 1 }))}
                        onClick={() => onMoveMedia(index, index + 1)}
                        disabled={index === media.length - 1}
                        variant="secondary"
                      >
                        <ArrowDownIcon />
                      </IconButton>
                    </div>
                    <IconButton
                      aria-label={String(t("cms.media.gallery.aria.remove", { index: index + 1 }))}
                      onClick={() => onRemoveMedia(index)}
                      variant="danger"
                    >
                      <Cross2Icon />
                    </IconButton>
                  </div>
                  <div className="absolute bottom-3 start-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-xs font-medium shadow">
                      <DragHandleDots2Icon aria-hidden />
                      {t("cms.media.gallery.drag")}
                    </span>
                  </div>
                </div>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

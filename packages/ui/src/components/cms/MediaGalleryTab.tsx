import { Card, CardContent } from "../atoms/shadcn";
import Image from "next/image";
import { IconButton } from "../atoms";
import { Grid } from "../atoms/primitives";
import type { MediaItem } from "@acme/types";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Cross2Icon,
  DragHandleDots2Icon,
} from "@radix-ui/react-icons";
import type { ReactNode } from "react";

// i18n-exempt — CMS editor UI; strings will be externalized later
/* i18n-exempt */
const t = (s: string) => s;

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
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          {uploader}
          {media.length === 0 && (
            <p className="text-sm text-muted-foreground">{t("Add imagery or video to showcase this product.")}</p>
          )}
          {media.length > 0 && (
            <Grid cols={1} gap={4} className="sm:grid-cols-2 lg:grid-cols-3">
              {media.map((item: MediaItem, index: number) => (
                <div
                  key={`${item.url}-${index}`}
                  className="group relative overflow-hidden rounded-xl border"
                >
                  {item.type === "image" ? (
                    <div className="relative h-48 w-full" data-aspect="16/9">
                      <Image
                        src={item.url}
                        alt={item.altText || ""}
                        fill
                        className="object-cover"
                        /* i18n-exempt — responsive image sizes string */
                        sizes="(min-width: 1024px) 33vw, 50vw"
                      />
                    </div>
                  ) : (
                    <video
                      src={item.url}
                      className="h-48 w-full object-cover"
                      data-aspect="16/9"
                      controls
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="flex items-center gap-1">
                      <IconButton
                        aria-label={`Move media ${index + 1} up`}
                        onClick={() => onMoveMedia(index, index - 1)}
                        disabled={index === 0}
                        variant="secondary"
                      >
                        <ArrowUpIcon />
                      </IconButton>
                      <IconButton
                        aria-label={`Move media ${index + 1} down`}
                        onClick={() => onMoveMedia(index, index + 1)}
                        disabled={index === media.length - 1}
                        variant="secondary"
                      >
                        <ArrowDownIcon />
                      </IconButton>
                    </div>
                    <IconButton
                      aria-label={`Remove media ${index + 1}`}
                      onClick={() => onRemoveMedia(index)}
                      variant="danger"
                    >
                      <Cross2Icon />
                    </IconButton>
                  </div>
                  <div className="absolute bottom-3 start-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-1 text-xs font-medium shadow">
                      <DragHandleDots2Icon aria-hidden />
                      {t("Drag")}
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

"use client";

import { useEffect, useState } from "react";

import { Grid } from "@acme/design-system/primitives";
import { Button, Checkbox, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { VideoBlockComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";
import useMediaLibrary from "./useMediaLibrary";

type Props = EditorProps<VideoBlockComponent>;

export default function VideoBlockEditor({ component, onChange }: Props) {
  const t = useTranslations();
  const handleInput = (field: keyof VideoBlockComponent & string, value: string | boolean) => {
    onChange({ [field]: value } as Partial<VideoBlockComponent>);
  };

  const [open, setOpen] = useState(false);
  const { media, loadMedia } = useMediaLibrary();
  useEffect(() => {
    if (open) void loadMedia();
  }, [open, loadMedia]);

  const videos = media.filter((m) => m.type === "video");
  const src = component.src;

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline">
            {src ? t("video.change") : t("video.select")}
          </Button>
        </DialogTrigger>
        <DialogContent className="w-full space-y-4">
          <DialogTitle>{t("video.select")}</DialogTitle>
          <Grid cols={3} gap={2} className="max-h-64 overflow-auto">
            {videos.map((m) => (
              <button
                key={m.url}
                type="button"
                onClick={() => {
                  handleInput("src", m.url);
                  setOpen(false);
                }}
                className="relative aspect-square min-w-11 min-h-11"
              >
                <video
                  src={m.url}
                  className="h-full w-full object-cover"
                  data-aspect="1/1"
                  muted
                  playsInline
                  aria-hidden
                  tabIndex={-1}
                />
              </button>
            ))}
            {videos.length === 0 && (
              <p className="text-muted-foreground col-span-3 text-sm">
                {t("video.noneFound")}
              </p>
            )}
          </Grid>
        </DialogContent>
      </Dialog>
      {src && (
         
        <video src={src} controls className="w-full max-h-64" data-aspect="16/9" />
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          id="autoplay"
          checked={component.autoplay ?? false}
          onCheckedChange={(checked) => handleInput("autoplay", Boolean(checked))}
        />
        <label htmlFor="autoplay" className="text-sm">
          {t("cms.lottie.autoplay")}
        </label>
      </div>
    </div>
  );
}

"use client";

import type { VideoBlockComponent } from "@acme/types";
import { Button, Checkbox, Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../atoms/shadcn";
import { useEffect, useState } from "react";
import useMediaLibrary from "./useMediaLibrary";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<VideoBlockComponent>;

export default function VideoBlockEditor({ component, onChange }: Props) {
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
            {src ? "Change video" : "Select video"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl space-y-4">
          <DialogTitle>Select video</DialogTitle>
          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-auto">
            {videos.map((m) => (
              <button
                key={m.url}
                type="button"
                onClick={() => {
                  handleInput("src", m.url);
                  setOpen(false);
                }}
                className="relative aspect-square"
              >
                <video src={m.url} className="h-full w-full object-cover" />
              </button>
            ))}
            {videos.length === 0 && (
              <p className="text-muted-foreground col-span-3 text-sm">
                No videos found.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {src && (
        <video src={src} controls className="w-full max-h-64" />
      )}
      <div className="flex items-center gap-2">
        <Checkbox
          id="autoplay"
          checked={component.autoplay ?? false}
          onCheckedChange={(checked) => handleInput("autoplay", Boolean(checked))}
        />
        <label htmlFor="autoplay" className="text-sm">
          Autoplay
        </label>
      </div>
    </div>
  );
}

// apps/cms/src/app/cms/wizard/MediaUploadDialog.tsx

"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@ui";
import type { MediaItem } from "@types";
import MediaManager from "@ui";
import { ReactElement, useCallback, useEffect, useState } from "react";

/**
 * Upload-and-manage media files inside a modal dialog.
 *
 * This component is client-side (`"use client"`).
 * Because we cannot import server-only functions directly,
 * we delegate deletion to a tiny fetch helper (`handleDelete`).
 */
export default function MediaUploadDialog({
  shop,
}: {
  shop: string;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MediaItem[]>([]);

  /* -------------------------------------------------------------------- */
  /*  Load current files when dialog opens                                */
  /* -------------------------------------------------------------------- */
  useEffect(() => {
    if (!open) return;

    async function load() {
      const res = await fetch(`/cms/api/media?shop=${shop}`);
      if (res.ok) {
        const data = (await res.json()) as unknown;
        if (Array.isArray(data)) setFiles(data as MediaItem[]);
      }
    }

    void load();
  }, [open, shop]);

  /* -------------------------------------------------------------------- */
  /*  Delete helper passed to <MediaManager>                              */
  /* -------------------------------------------------------------------- */
  const handleDelete = useCallback(async (s: string, src: string) => {
    await fetch(
      `/cms/api/media?shop=${encodeURIComponent(s)}&src=${encodeURIComponent(
        src
      )}`,
      { method: "DELETE" }
    );
    /* <MediaManager> removes the item from its own state;
         nothing else to do here. */
  }, []);

  /* -------------------------------------------------------------------- */
  /*  Render                                                              */
  /* -------------------------------------------------------------------- */
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Upload Media</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Media Library</DialogTitle>
        <MediaManager
          shop={shop}
          initialFiles={files}
          onDelete={handleDelete}
        />
      </DialogContent>
    </Dialog>
  );
}

import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/atoms-shadcn";
import type { MediaItem } from "@types";
import MediaManager from "@ui/components/cms/MediaManager";
import { useEffect, useState } from "react";

export default function MediaUploadDialog({ shop }: { shop: string }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const res = await fetch(`/cms/api/media?shop=${shop}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setFiles(data);
      }
    }
    void load();
  }, [open, shop]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Upload Media</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Media Library</DialogTitle>
        <MediaManager shop={shop} initialFiles={files} />
      </DialogContent>
    </Dialog>
  );
}

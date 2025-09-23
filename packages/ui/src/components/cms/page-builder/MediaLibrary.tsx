// packages/ui/src/components/cms/page-builder/MediaLibrary.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import useMediaLibrary from "./useMediaLibrary";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogTitle, DialogFooter } from "../../atoms/shadcn";
import { ImageIcon, VideoIcon, MixIcon, TokensIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Tooltip } from "../../atoms";

interface Props {
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection?: boolean;
}

export default function MediaLibrary({ onInsertImage, onSetSectionBackground, selectedIsSection }: Props) {
  const { media, loadMedia, loading, error } = useMediaLibrary();
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [type, setType] = useState<"all" | "image" | "video">("all");
  const [page, setPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [editUrl, setEditUrl] = useState<string>("");
  const [editAlt, setEditAlt] = useState<string>("");
  const [editAspect, setEditAspect] = useState<string>("");
  const pageSize = 24;
  useEffect(() => { void loadMedia(); }, [loadMedia]);
  useEffect(() => { setPage(1); }, [q, tag, type]);
  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of media) for (const t of it.tags || []) map.set(t, (map.get(t) || 0) + 1);
    return Array.from(map.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label));
  }, [media]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return media.filter((it) => {
      if (type !== 'all' && it.type !== type) return false;
      if (tag && !(it.tags || []).includes(tag)) return false;
      if (!query) return true;
      const namePart = it.url.split("/").pop() || it.url;
      const inName = namePart.toLowerCase().includes(query);
      const inTags = (it.tags || []).some((t) => t.toLowerCase().includes(query));
      const inTitle = (it.title || "").toLowerCase().includes(query);
      const inAlt = (it.altText || "").toLowerCase().includes(query);
      return inName || inTags || inTitle || inAlt;
    });
  }, [media, q, tag, type]);
  const total = filtered.length;
  const pageItems = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  return (
    <div className="flex flex-col gap-3" data-tour="media-library">
      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search filename, title or tag"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger aria-label="Filter media type" title="Filter media type">
            {type === "image" ? (
              <ImageIcon className="h-4 w-4" />
            ) : type === "video" ? (
              <VideoIcon className="h-4 w-4" />
            ) : (
              <MixIcon className="h-4 w-4" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all</SelectItem>
            <SelectItem value="image">image</SelectItem>
            <SelectItem value="video">video</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={(v) => setTag(v)}>
          <SelectTrigger aria-label="Filter by tag" title="Filter by tag">
            <TokensIcon className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.label} value={t.label}>
                {t.label} ({t.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" aria-label="Refresh" title="Refresh" variant="outline" onClick={() => void loadMedia()}>
          <ReloadIcon className="h-4 w-4" />
        </Button>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && (
        <p className="text-danger text-sm" role="alert">{error}</p>
      )}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {pageItems.map((it) => (
              <div key={it.url} className="overflow-hidden rounded border">
                <div className="relative aspect-[4/3] bg-muted">
                  {it.type === 'image' ? (
                    <Image src={it.url} alt={it.altText || it.title || ''} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">video</div>
                  )}
                </div>
                <div className="flex items-center gap-2 p-2">
                  <Tooltip text="Insert image into the canvas">
                    <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => onInsertImage(it.url)}>Insert</Button>
                  </Tooltip>
                  {it.type === 'image' && (
                    <Tooltip text="Edit alt text and aspect before inserting">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => { setEditUrl(it.url); setEditAlt(it.altText || ""); setEditAspect(""); setEditOpen(true); }}
                      >
                        Edit…
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip text={selectedIsSection ? "Set selected section background" : "Select a section to set background"}>
                    <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => onSetSectionBackground(it.url)} disabled={!selectedIsSection}>Set BG</Button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogTitle>Insert Image</DialogTitle>
              <div className="space-y-2">
                <Input label="Alt text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} placeholder="Describe the image for accessibility" />
                <Select value={editAspect} onValueChange={(v) => setEditAspect(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aspect (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Original</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                    <SelectItem value="3:4">3:4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <div className="mr-auto text-xs text-muted-foreground">Alt text improves accessibility</div>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button
                  type="button"
                  onClick={() => {
                    try {
                      window.dispatchEvent(new CustomEvent('pb:insert-image', { detail: { url: editUrl, alt: editAlt || undefined, cropAspect: editAspect || undefined } }));
                    } catch {}
                    setEditOpen(false);
                  }}
                >
                  Insert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex items-center justify-between text-xs">
            <div>
              {total > 0 ? (
                <span>{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}</span>
              ) : (
                <span>No results</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Prev</Button>
              <span>Page {page}</span>
              <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => setPage(page + 1)} disabled={page * pageSize >= total}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

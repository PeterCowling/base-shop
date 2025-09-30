// packages/ui/src/components/cms/page-builder/MediaLibrary.tsx
"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "@acme/i18n";
import useMediaLibrary from "./useMediaLibrary";
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogTitle, DialogFooter } from "../../atoms/shadcn";
import { ImageIcon, VideoIcon, MixIcon, TokensIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Tooltip } from "../../atoms";
import { Grid } from "../../atoms/primitives";

interface Props {
  onInsertImage: (url: string) => void;
  onSetSectionBackground: (url: string) => void;
  selectedIsSection?: boolean;
}

export default function MediaLibrary({ onInsertImage, onSetSectionBackground, selectedIsSection }: Props) {
  const { media, loadMedia, loading, error } = useMediaLibrary();
  const t = useTranslations();
  const TOUR_ID = "media-library"; // i18n-exempt -- I18N-0002 telemetry/id attr, not user copy [ttl=2026-01-31]
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
    <div className="flex flex-col gap-3" data-tour={TOUR_ID}>
      <div className="flex items-center gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("cms.mediaLibrary.search.placeholder")}
        />
      </div>
      <Grid cols={3} gap={2}>
        <Select value={type} onValueChange={(v: "all" | "image" | "video") => setType(v)}>
          <SelectTrigger aria-label={String(t("cms.mediaLibrary.filter.type"))} title={String(t("cms.mediaLibrary.filter.type"))}>
            {type === "image" ? (
              <ImageIcon className="h-4 w-4" />
            ) : type === "video" ? (
              <VideoIcon className="h-4 w-4" />
            ) : (
              <MixIcon className="h-4 w-4" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("cms.mediaLibrary.type.all")}</SelectItem>
            <SelectItem value="image">{t("cms.mediaLibrary.type.image")}</SelectItem>
            <SelectItem value="video">{t("cms.mediaLibrary.type.video")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tag} onValueChange={(v) => setTag(v)}>
          <SelectTrigger aria-label={String(t("cms.mediaLibrary.filter.tag"))} title={String(t("cms.mediaLibrary.filter.tag"))}>
            <TokensIcon className="h-4 w-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">{t("cms.mediaLibrary.tags.all")}</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.label} value={t.label}>
                {t.label} ({t.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" aria-label={String(t("actions.refreshList"))} title={String(t("actions.refreshList"))} variant="outline" size="icon" onClick={() => void loadMedia()}>
          <ReloadIcon className="h-4 w-4" />
        </Button>
      </Grid>
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}{/* i18n-exempt: admin tool */}
      {error && (
        <p className="text-danger text-sm" role="alert">{error}</p>
      )}
      {!loading && !error && (
        <>
          <Grid cols={3} gap={2}>
            {pageItems.map((it) => (
              <div key={it.url} className="overflow-hidden rounded border">
                <div className="relative aspect-video bg-muted">
                  {it.type === 'image' ? (
                    <Image src={it.url} alt={it.altText || it.title || ''} fill className="object-cover" />
                  ) : (
                    <Grid cols={1} gap={0} className="absolute inset-0 place-items-center text-xs text-muted-foreground">{t("cms.mediaLibrary.videoLabel")}</Grid>
                  )}
                </div>
                <div className="flex items-center gap-2 p-2">
                  <Tooltip text={t("cms.mediaLibrary.tooltip.insert")}> 
                    <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => onInsertImage(it.url)}>{t("cms.mediaLibrary.actions.insert")}</Button>
                  </Tooltip>
                  {it.type === 'image' && (
                    <Tooltip text={t("cms.mediaLibrary.tooltip.editBeforeInsert")}>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => { setEditUrl(it.url); setEditAlt(it.altText || ""); setEditAspect(""); setEditOpen(true); }}
                      >
                        {t("cms.mediaLibrary.actions.edit")}
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip text={selectedIsSection ? t("cms.mediaLibrary.tooltip.setSectionBg") : t("cms.mediaLibrary.tooltip.selectSectionFirst")}>
                    <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => onSetSectionBackground(it.url)} disabled={!selectedIsSection}>{t("cms.mediaLibrary.actions.setBg")}</Button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </Grid>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogTitle>{t("cms.mediaLibrary.dialog.insertImage.title")}</DialogTitle>
              <div className="space-y-2">
                <Input label={t("cms.mediaLibrary.form.alt.label")} value={editAlt} onChange={(e) => setEditAlt(e.target.value)} placeholder={t("cms.mediaLibrary.form.alt.placeholder")} />
                <Select value={editAspect} onValueChange={(v) => setEditAspect(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("cms.mediaLibrary.form.aspect.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("cms.mediaLibrary.aspect.original")}</SelectItem>
                    <SelectItem value="16:9">16:9</SelectItem> {/* i18n-exempt: admin tool */}
                    <SelectItem value="4:3">4:3</SelectItem> {/* i18n-exempt: admin tool */}
                    <SelectItem value="1:1">1:1</SelectItem> {/* i18n-exempt: admin tool */}
                    <SelectItem value="3:4">3:4</SelectItem> {/* i18n-exempt: admin tool */}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <div className="me-auto text-xs text-muted-foreground">{t("cms.mediaLibrary.form.alt.help")}</div>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t("actions.cancel")}</Button>
                <Button
                  type="button"
                  onClick={() => {
                    try {
                      window.dispatchEvent(new CustomEvent('pb:insert-image', { detail: { url: editUrl, alt: editAlt || undefined, cropAspect: editAspect || undefined } }));
                    } catch {}
                    setEditOpen(false);
                  }}
                >
                  {t("cms.mediaLibrary.actions.insert")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <div className="flex items-center justify-between text-xs">
            <div>
              {total > 0 ? (
                <span>{`${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}</span>
              ) : (
                <span>{t("No results")}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>{t("actions.prev")}</Button>
              <span>{t("common.page")} {page}</span>
              <Button type="button" variant="outline" className="h-auto px-2 py-1 text-xs" onClick={() => setPage(page + 1)} disabled={page * pageSize >= total}>{t("actions.next")}</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Tooltip } from "../../atoms";
import { useTranslations } from "@acme/i18n";
import type { LibraryItem } from "./libraryStore";

export default function LibraryPaletteItem({ item, onDelete, onToggleShare, onUpdate, shop }: { item: LibraryItem; onDelete: () => void; onToggleShare: () => void; onUpdate: (patch: Partial<Pick<LibraryItem, "label" | "tags" | "thumbnail">>) => void; shop?: string | null }) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({ id: `lib-${item.id}`, data: { from: "library", template: item.template, templates: item.templates, label: item.label, thumbnail: item.thumbnail } });
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(Array.isArray(item.tags) ? item.tags : []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }, [tagInput]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  const handleThumbFile = useCallback(async (f: File | null | undefined) => {
    if (!f) return;
    try {
      if (shop) {
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch(`/api/media?shop=${encodeURIComponent(shop)}&orientation=landscape`, { method: "POST", body: fd });
        if (res.ok) {
          const media = await res.json();
          const url = (media && (media.url || media.fileUrl || media.path)) as string | undefined;
          if (url) {
            onUpdate({ thumbnail: url });
            return;
          }
        }
      }
      // Fallback to data URL
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("read error"));
        reader.onload = () => {
          onUpdate({ thumbnail: String(reader.result) });
          resolve();
        };
        reader.readAsDataURL(f);
      });
    } catch {
      // ignore
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [onUpdate, shop]);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-pressed={isDragging}
      aria-describedby="pb-drag-instructions"
      title={t('pb.library.dragToInsert')}
      // eslint-disable-next-line react/forbid-dom-props -- PB-2419: dnd-kit requires dynamic transform style during drag
      style={{ transform: CSS.Transform.toString(transform) }}
      className="flex cursor-grab items-center gap-2 rounded border p-2 text-sm"
    >
      {item.thumbnail ? (
        <Image
          src={item.thumbnail}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 rounded object-cover"
          width={24}
          height={24}
          loading="lazy"
        />
      ) : (
        <Image
          src={"/window.svg"}
          alt=""
          aria-hidden="true"
          className="h-6 w-6 rounded"
          width={24}
          height={24}
          loading="lazy"
        />
      )}
      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input className="min-w-0 flex-1 rounded border px-2 py-1 text-xs" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
                  {t}
                  {/* i18n-exempt: Admin-only CMS tool UI copy. */}
                  <button
                    type="button"
                    aria-label={`Remove ${t}`}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded border px-1"
                    onClick={(e) => { e.stopPropagation(); setTags((prev) => prev.filter((x) => x !== t)); }}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                className="min-w-24 flex-1 rounded border px-2 py-1 text-xs"
                // i18n-exempt: Admin-only CMS tool UI copy.
                placeholder="add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                // i18n-exempt: Admin-only CMS tool UI copy.
                aria-label="Add tag"
              />
              {/* i18n-exempt: Admin-only CMS tool UI copy. */}
              <button type="button" className="min-h-10 min-w-10 rounded border px-2 text-xs" onClick={(e) => { e.stopPropagation(); addTag(); }}>Add</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <span className="flex-1 truncate" title={item.label}>{item.label}</span>
          {Array.isArray(item.tags) && item.tags.length > 0 && (
            <span className="hidden md:block text-xs text-muted-foreground truncate w-40" title={item.tags.join(", ")}>
              {item.tags.join(", ")}
            </span>
          )}
        </>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleThumbFile(e.target.files?.[0])} />
      {/* i18n: Admin UI — Page Builder Library */}
      <Tooltip text={t('pb.library.uploadThumbnail')}>
        <button
          type="button"
          aria-label={t('pb.library.uploadThumbnail')}
          className="min-h-10 min-w-10 rounded border px-2 text-xs"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          title={t('pb.library.uploadThumbnail')}
        >
          {t('pb.library.thumb')}
        </button>
      </Tooltip>
      {item.thumbnail && (
        // i18n: Admin UI — Page Builder Library
        <Tooltip text={t('pb.library.clearThumbnail')}>
          <button
            type="button"
            aria-label={t('pb.library.clearThumbnail')}
            className="min-h-10 min-w-10 rounded border px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); onUpdate({ thumbnail: null }); }}
          >
            {t('pb.library.clear')}
          </button>
        </Tooltip>
      )}
      {editing ? (
        <>
          {/* i18n: Admin UI — Page Builder Library */}
          <Tooltip text={t('pb.library.saveChanges')}>
            <button
              type="button"
              aria-label={t('pb.library.save')}
              className="min-h-10 min-w-10 rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                const nextTags = tags.map((t) => t.trim()).filter(Boolean);
                onUpdate({ label: label.trim() || item.label, tags: nextTags });
                setEditing(false);
              }}
            >
              {t('pb.library.save')}
            </button>
          </Tooltip>
          {/* i18n: Admin UI — Page Builder Library */}
          <Tooltip text={t('pb.library.cancelEditing')}>
            <button
              type="button"
              aria-label={t('pb.library.cancel')}
              className="min-h-10 min-w-10 rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setLabel(item.label);
                setTags(Array.isArray(item.tags) ? item.tags : []);
                setEditing(false);
              }}
            >
              {t('pb.library.cancel')}
            </button>
          </Tooltip>
        </>
      ) : (
        // i18n: Admin UI — Page Builder Library
        <Tooltip text={t('pb.library.editItem')}>
          <button
            type="button"
            aria-label={t('pb.library.edit')}
            className="min-h-10 min-w-10 rounded border px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {t('pb.library.edit')}
          </button>
        </Tooltip>
      )}
      {/* i18n: Admin UI — Page Builder Library */}
      <Tooltip text={item.shared ? t('pb.library.unshareWithTeam') : t('pb.library.shareWithTeam')}>
        <button
          type="button"
          aria-label={item.shared ? t('pb.library.unshare') : t('pb.library.share')}
          className={`min-h-10 min-w-10 rounded border px-2 text-xs ${item.shared ? "bg-green-50" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleShare();
          }}
          // i18n: Admin UI — Page Builder Library
          title={item.shared ? t('pb.library.sharedWithTeam') : t('pb.library.private')}
        >
          {item.shared ? t('pb.library.shared') : t('pb.library.private')}
        </button>
      </Tooltip>
      {/* i18n: Admin UI — Page Builder Library */}
      <Tooltip text={t('pb.library.deleteFromMyLibrary')}>
        <button
          type="button"
          aria-label={t('pb.library.deleteFromMyLibrary')}
          className="min-h-10 min-w-10 rounded border px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          {t('pb.library.delete')}
        </button>
      </Tooltip>
    </div>
  );
}

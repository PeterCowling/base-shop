"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Tooltip } from "../../atoms";
import type { LibraryItem } from "./libraryStore";

export default function LibraryPaletteItem({ item, onDelete, onToggleShare, onUpdate, shop }: { item: LibraryItem; onDelete: () => void; onToggleShare: () => void; onUpdate: (patch: Partial<Pick<LibraryItem, "label" | "tags" | "thumbnail">>) => void; shop?: string | null }) {
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
      title="Drag to insert"
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
                  <button type="button" aria-label={`Remove ${t}`} className="rounded border px-1" onClick={(e) => { e.stopPropagation(); setTags((prev) => prev.filter((x) => x !== t)); }}>×</button>
                </span>
              ))}
              <input
                className="min-w-[6rem] flex-1 rounded border px-2 py-1 text-xs"
                placeholder="add tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Add tag"
              />
              <button type="button" className="rounded border px-2 text-xs" onClick={(e) => { e.stopPropagation(); addTag(); }}>Add</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <span className="flex-1 truncate" title={item.label}>{item.label}</span>
          {Array.isArray(item.tags) && item.tags.length > 0 && (
            <span className="hidden md:block text-xs text-muted-foreground truncate max-w-[10rem]" title={item.tags.join(", ")}>
              {item.tags.join(", ")}
            </span>
          )}
        </>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleThumbFile(e.target.files?.[0])} />
      <Tooltip text="Upload thumbnail">
        <button
          type="button"
          aria-label="Upload thumbnail"
          className="rounded border px-2 text-xs"
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
          title="Upload thumbnail"
        >
          Thumb
        </button>
      </Tooltip>
      {item.thumbnail && (
        <Tooltip text="Clear thumbnail">
          <button
            type="button"
            aria-label="Clear thumbnail"
            className="rounded border px-2 text-xs"
            onClick={(e) => { e.stopPropagation(); onUpdate({ thumbnail: null }); }}
          >
            Clear
          </button>
        </Tooltip>
      )}
      {editing ? (
        <>
          <Tooltip text="Save changes">
            <button
              type="button"
              aria-label="Save"
              className="rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                const nextTags = tags.map((t) => t.trim()).filter(Boolean);
                onUpdate({ label: label.trim() || item.label, tags: nextTags });
                setEditing(false);
              }}
            >
              Save
            </button>
          </Tooltip>
          <Tooltip text="Cancel editing">
            <button
              type="button"
              aria-label="Cancel"
              className="rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setLabel(item.label);
                setTags(Array.isArray(item.tags) ? item.tags : []);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </Tooltip>
        </>
      ) : (
        <Tooltip text="Edit item">
          <button
            type="button"
            aria-label="Edit"
            className="rounded border px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            Edit
          </button>
        </Tooltip>
      )}
      <Tooltip text={item.shared ? "Unshare with team" : "Share with team"}>
        <button
          type="button"
          aria-label={item.shared ? "Unshare" : "Share"}
          className={`rounded border px-2 text-xs ${item.shared ? "bg-green-50" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleShare();
          }}
          title={item.shared ? "Shared with team" : "Private"}
        >
          {item.shared ? "Shared" : "Private"}
        </button>
      </Tooltip>
      <Tooltip text="Delete from My Library">
        <button
          type="button"
          aria-label="Delete from My Library"
          className="rounded border px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </button>
      </Tooltip>
    </div>
  );
}

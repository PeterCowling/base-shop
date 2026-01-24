"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Tooltip } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

import type { LibraryItem } from "./libraryStore";

interface LibraryPaletteItemProps {
  item: LibraryItem;
  onDelete: () => void;
  onToggleShare: () => void;
  onUpdate: (patch: Partial<Pick<LibraryItem, "label" | "tags" | "thumbnail">>) => void;
  shop?: string | null;
}

interface EditorFieldsProps {
  label: string;
  setLabel: (value: string) => void;
  tags: string[];
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagInput: string;
  setTagInput: (value: string) => void;
  addTag: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

function EditorFields({
  label,
  setLabel,
  tags,
  setTags,
  tagInput,
  setTagInput,
  addTag,
  onKeyDown,
}: EditorFieldsProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <input
        className="min-w-0 flex-1 rounded border px-2 py-1 text-xs"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
      />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs">
              {tag}
              {/* i18n-exempt: Admin-only CMS tool UI copy. */}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setTags((prev) => prev.filter((x) => x !== tag));
                }}
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
            onKeyDown={onKeyDown}
            // i18n-exempt: Admin-only CMS tool UI copy.
            aria-label="Add tag"
          />
          {/* i18n-exempt: Admin-only CMS tool UI copy. */}
          <button
            type="button"
            className="min-h-11 min-w-11 rounded border px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              addTag();
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

interface ThumbnailPreviewProps {
  thumbnail: string | null | undefined;
}

function ThumbnailPreview({ thumbnail }: ThumbnailPreviewProps) {
  const src = thumbnail || "/window.svg";
  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      className="h-6 w-6 rounded object-cover"
      width={24}
      height={24}
      loading="lazy"
    />
  );
}

interface LibraryPaletteItemActionsProps {
  item: LibraryItem;
  t: ReturnType<typeof useTranslations>;
  editing: boolean;
  label: string;
  tags: string[];
  setEditing: (value: boolean) => void;
  setLabel: (value: string) => void;
  setTags: React.Dispatch<React.SetStateAction<string[]>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleThumbFile: (file: File | null | undefined) => Promise<void>;
  onUpdate: (patch: Partial<Pick<LibraryItem, "label" | "tags" | "thumbnail">>) => void;
  onDelete: () => void;
  onToggleShare: () => void;
}

function LibraryPaletteItemActions({
  item,
  t,
  editing,
  label,
  tags,
  setEditing,
  setLabel,
  setTags,
  fileInputRef,
  handleThumbFile,
  onUpdate,
  onDelete,
  onToggleShare,
}: LibraryPaletteItemActionsProps) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleThumbFile(e.target.files?.[0])}
      />
      {/* i18n: Admin UI — Page Builder Library */}
      <Tooltip text={t("pb.library.uploadThumbnail")}>
        <button
          type="button"
          aria-label={t("pb.library.uploadThumbnail") as string}
          className="min-h-11 min-w-11 rounded border px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
          title={t("pb.library.uploadThumbnail") as string}
        >
          {t("pb.library.thumb")}
        </button>
      </Tooltip>
      {item.thumbnail && (
        // i18n: Admin UI — Page Builder Library
        <Tooltip text={t("pb.library.clearThumbnail")}>
          <button
            type="button"
            aria-label={t("pb.library.clearThumbnail") as string}
            className="min-h-11 min-w-11 rounded border px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ thumbnail: null });
            }}
          >
            {t("pb.library.clear")}
          </button>
        </Tooltip>
      )}
      {editing ? (
        <>
          {/* i18n: Admin UI — Page Builder Library */}
          <Tooltip text={t("pb.library.saveChanges")}>
            <button
              type="button"
              aria-label={t("pb.library.save") as string}
              className="min-h-11 min-w-11 rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                const nextTags = tags.map((tag) => tag.trim()).filter(Boolean);
                onUpdate({ label: label.trim() || item.label, tags: nextTags });
                setEditing(false);
              }}
            >
              {t("pb.library.save")}
            </button>
          </Tooltip>
          {/* i18n: Admin UI — Page Builder Library */}
          <Tooltip text={t("pb.library.cancelEditing")}>
            <button
              type="button"
              aria-label={t("pb.library.cancel") as string}
              className="min-h-11 min-w-11 rounded border px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                setLabel(item.label);
                setTags(Array.isArray(item.tags) ? item.tags : []);
                setEditing(false);
              }}
            >
              {t("pb.library.cancel")}
            </button>
          </Tooltip>
        </>
      ) : (
        // i18n: Admin UI — Page Builder Library
        <Tooltip text={t("pb.library.editItem")}>
          <button
            type="button"
            aria-label={t("pb.library.edit") as string}
            className="min-h-11 min-w-11 rounded border px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {t("pb.library.edit")}
          </button>
        </Tooltip>
      )}
      {/* i18n: Admin UI — Page Builder Library */}
      <Tooltip text={item.shared ? t("pb.library.unshareWithTeam") : t("pb.library.shareWithTeam")}>
        <button
          type="button"
          aria-label={(item.shared ? t("pb.library.unshare") : t("pb.library.share")) as string}
          className={`min-h-11 min-w-11 rounded border px-2 text-xs ${item.shared ? "bg-primary/10" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleShare();
          }}
          // i18n: Admin UI — Page Builder Library
          title={(item.shared ? t("pb.library.sharedWithTeam") : t("pb.library.private")) as string}
        >
          {item.shared ? t("pb.library.shared") : t("pb.library.private")}
        </button>
      </Tooltip>
      {/* i18n: Admin UI — Page Builder Library */}
      <Tooltip text={t("pb.library.deleteFromMyLibrary")}>
        <button
          type="button"
          aria-label={t("pb.library.deleteFromMyLibrary") as string}
          className="min-h-11 min-w-11 rounded border px-2 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          {t("pb.library.delete")}
        </button>
      </Tooltip>
    </>
  );
}

export default function LibraryPaletteItem({
  item,
  onDelete,
  onToggleShare,
  onUpdate,
  shop,
}: LibraryPaletteItemProps) {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useSortable({
      id: `lib-${item.id}`,
      data: {
        from: "library",
        template: item.template,
        templates: item.templates,
        label: item.label,
        thumbnail: item.thumbnail,
      },
    });
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
        const res = await fetch(`/api/media?shop=${encodeURIComponent(shop)}&orientation=landscape`, {
          method: "POST",
          body: fd,
        });
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
      title={t("pb.library.dragToInsert") as string}
       
      style={{ transform: CSS.Transform.toString(transform) }}
      className="flex cursor-grab items-center gap-2 rounded border p-2 text-sm"
    >
      <ThumbnailPreview thumbnail={item.thumbnail} />
      {editing ? (
        <EditorFields
          label={label}
          setLabel={setLabel}
          tags={tags}
          setTags={setTags}
          tagInput={tagInput}
          setTagInput={setTagInput}
          addTag={addTag}
          onKeyDown={handleKeyDown}
        />
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
      <LibraryPaletteItemActions
        item={item}
        t={t}
        editing={editing}
        label={label}
        tags={tags}
        setEditing={setEditing}
        setLabel={setLabel}
        setTags={setTags}
        fileInputRef={fileInputRef}
        handleThumbFile={handleThumbFile}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggleShare={onToggleShare}
      />
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@acme/i18n";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, Button } from "../../atoms/shadcn";
import { listLibrary, saveLibrary, clearLibrary, syncFromServer, type LibraryItem } from "./libraryStore";
import { validateTemplateCreation } from "@acme/platform-core/validation/templateValidation";
import { rootPlacementOptions } from "@acme/platform-core/validation/options";
import { ulid } from "ulid";

interface Props {
  shop: string | null | undefined;
  onAfterChange?: () => void;
}

export default function LibraryImportExport({ shop, onAfterChange }: Props) {
  const t = useTranslations();
  const tf = (key: string, fallback: string) => {
    const val = t(key) as string;
    return val === key ? fallback : val;
  };
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<LibraryItem[]>([]);

  const refresh = useCallback(async () => {
    const remote = await syncFromServer(shop);
    setItems(remote ?? listLibrary(shop));
  }, [shop]);

  useEffect(() => {
    if (!open) return;
    void refresh();
  }, [open, refresh]);

  const handleExport = useCallback(async () => {
    setBusy(true);
    try {
      await refresh();
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      const dt = new Date();
      const ymd = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      a.href = URL.createObjectURL(blob);
      a.download = `pb-library-${shop || "default"}-${ymd}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setMessage(String(tf("cms.library.exported", "Exported library JSON")));
    } catch (err) {
      // i18n-exempt: developer log
      console.error(err);
      setMessage(String(tf("cms.library.exportFailed", "Export failed")));
    } finally {
      setBusy(false);
    }
  }, [items, refresh, shop, t]);

  const handleImportFiles = useCallback(async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const f = files[0];
      const text = await f.text();
      const parsed = JSON.parse(text) as unknown;
      const inItems: LibraryItem[] = Array.isArray(parsed)
        ? (parsed as LibraryItem[])
        : (typeof parsed === "object" && parsed !== null && "items" in (parsed as Record<string, unknown>) && Array.isArray((parsed as { items?: unknown }).items))
          ? ((parsed as { items: LibraryItem[] }).items)
          : [];
      if (!inItems.length) throw new Error(String(tf("cms.library.importInvalid", "Invalid file format")));
      const clones = inItems.map((item) => {
        const clone = { ...item } as LibraryItem;
        clone.id = ulid();
        delete (clone as { ownerUserId?: string }).ownerUserId;
        clone.shared = false;
        return clone;
      });
      // Preflight validate all incoming templates as ROOT placement
      for (const it of clones) {
        const templates = (it.templates && Array.isArray(it.templates)) ? it.templates : (it.template ? [it.template] : []);
        if (templates.length) {
          const pre = validateTemplateCreation(templates as any, rootPlacementOptions());
          if (pre.ok === false) {
            throw new Error([tf("cms.library.importValidationFailed", "Import failed: invalid item"), ...(pre.errors || [])].filter(Boolean).join("\n"));
          }
        }
      }
      if (shop) {
        await fetch(`/api/library?shop=${encodeURIComponent(shop)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: clones }),
        });
        await refresh();
      } else {
        for (const clone of clones) {
          await saveLibrary(shop, clone);
        }
        await refresh();
      }
      onAfterChange?.();
      setMessage(String(tf("cms.library.importedN", `Imported ${inItems.length} item(s)`)));
    } catch (err) {
      // i18n-exempt: developer log
      console.error(err);
      setMessage(String(tf("cms.library.importFailed", "Import failed. Please check your file.")));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [shop, onAfterChange, refresh, t]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void handleImportFiles(e.dataTransfer?.files ?? null);
  }, [handleImportFiles]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const canClear = useMemo(() => items.length > 0, [items.length]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{tf("cms.library.importExport.button", "Import/Export")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{tf("cms.library.importExport.title", "Library Import / Export")}</DialogTitle>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{tf("cms.library.importExport.description", "Export your current library to a JSON file or import items from a JSON file exported here.")}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={handleExport}>{tf("cms.library.exportJSON", "Export JSON")}</Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => void handleImportFiles(e.target.files)} /> {/* i18n-exempt -- ENG-1234 non-user-facing attribute [ttl=2026-12-31] */}
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>{tf("cms.library.importJSON", "Import JSON")}</Button>
            <Button type="button" variant="outline" disabled={busy || !canClear} onClick={async () => { if (confirm(String(tf("cms.library.clearConfirm", "Clear your personal library?")))) { await clearLibrary(shop); await refresh(); onAfterChange?.(); } }}>{tf("cms.library.clear", "Clear Library")}</Button>
          </div>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground"
            // Treat as interactive dropzone for a11y
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label={String(tf("cms.library.dropAria", "Drop JSON file here"))}
          >
            {tf("cms.library.dropHelp", "Drag & drop a JSON file here to import")}
          </div>
          <div aria-live="polite" className="text-sm">{message}</div>
          <div className="text-xs text-muted-foreground">{tf("cms.library.itemsCount", "Items in your library:")} {items.length}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

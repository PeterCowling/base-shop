"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, Button } from "../../atoms/shadcn";
import { listLibrary, saveLibrary, clearLibrary, syncFromServer, type LibraryItem } from "./libraryStore";
import { ulid } from "ulid";

interface Props {
  shop: string | null | undefined;
  onAfterChange?: () => void;
}

export default function LibraryImportExport({ shop, onAfterChange }: Props) {
  // i18n-exempt — editor-only import/export dialog copy
  const t = (s: string) => s;
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
      setMessage(t("Exported library JSON"));
    } catch (err) {
      // i18n-exempt: developer log
      console.error(err);
      setMessage(t("Export failed"));
    } finally {
      setBusy(false);
    }
  }, [items, refresh, shop]);

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
      if (!inItems.length) throw new Error(t("Invalid file format"));
      const clones = inItems.map((item) => {
        const clone = { ...item } as LibraryItem;
        clone.id = ulid();
        delete (clone as { ownerUserId?: string }).ownerUserId;
        clone.shared = false;
        return clone;
      });
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
      setMessage(t(`Imported ${inItems.length} item(s)`));
    } catch (err) {
      // i18n-exempt: developer log
      console.error(err);
      setMessage(t("Import failed. Please check your file."));
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [shop, onAfterChange, refresh]);

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
        <Button variant="outline">{t("Import/Export")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t("Library Import / Export")}</DialogTitle>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("Export your current library to a JSON file or import items from a JSON file exported here.")}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={handleExport}>{t("Export JSON")}</Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => void handleImportFiles(e.target.files)} /> {/* i18n-exempt -- non-user-facing attribute */}
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>{t("Import JSON")}</Button>
            <Button type="button" variant="outline" disabled={busy || !canClear} onClick={async () => { if (confirm(t("Clear your personal library?"))) { await clearLibrary(shop); await refresh(); onAfterChange?.(); } }}>{t("Clear Library")}</Button>
          </div>
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground"
            // i18n-exempt
            aria-label={t("Drop JSON file here")}
          >
            {t("Drag & drop a JSON file here to import")}
          </div>
          <div aria-live="polite" className="text-sm">{message}</div>
          <div className="text-xs text-muted-foreground">{t("Items in your library:")} {items.length}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

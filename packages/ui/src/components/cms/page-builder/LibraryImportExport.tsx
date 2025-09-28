"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "@acme/i18n";
import { Dialog, DialogContent, DialogTitle, DialogTrigger, Button } from "../../atoms/shadcn";
import { listLibrary, saveLibrary, clearLibrary, syncFromServer, type LibraryItem } from "./libraryStore";
import { ulid } from "ulid";

interface Props {
  shop: string | null | undefined;
  onAfterChange?: () => void;
}

export default function LibraryImportExport({ shop, onAfterChange }: Props) {
  const t = useTranslations();
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
      setMessage(String(t("cms.library.exported")));
    } catch (err) {
      // i18n-exempt: developer log
      console.error(err);
      setMessage(String(t("cms.library.exportFailed")));
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
      if (!inItems.length) throw new Error(String(t("cms.library.importInvalid")));
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
      setMessage(String(t("cms.library.importedN", { count: inItems.length })));
    } catch (err) {
      // i18n-exempt: developer log
      console.error(err);
      setMessage(String(t("cms.library.importFailed")));
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
        <Button variant="outline">{t("cms.library.importExport.button")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t("cms.library.importExport.title")}</DialogTitle>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("cms.library.importExport.description")}</p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" disabled={busy} onClick={handleExport}>{t("cms.library.exportJSON")}</Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={(e) => void handleImportFiles(e.target.files)} /> {/* i18n-exempt -- ENG-1234 non-user-facing attribute [ttl=2026-12-31] */}
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileInputRef.current?.click()}>{t("cms.library.importJSON")}</Button>
            <Button type="button" variant="outline" disabled={busy || !canClear} onClick={async () => { if (confirm(String(t("cms.library.clearConfirm")))) { await clearLibrary(shop); await refresh(); onAfterChange?.(); } }}>{t("cms.library.clear")}</Button>
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
            aria-label={String(t("cms.library.dropAria"))}
          >
            {t("cms.library.dropHelp")}
          </div>
          <div aria-live="polite" className="text-sm">{message}</div>
          <div className="text-xs text-muted-foreground">{t("cms.library.itemsCount")} {items.length}</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

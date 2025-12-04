"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DialogHeader, DialogTitle, Button, Input } from "../../atoms/shadcn";
import { Drawer, DrawerContent } from "../../atoms/primitives/drawer";
import { Tooltip } from "../../atoms";
import { Inline } from "../../atoms/primitives/Inline";
import {
  listGlobals,
  listGlobalsForPage,
  saveGlobalForPage,
  removeGlobalForPage,
  updateGlobal,
  removeGlobal,
  type GlobalItem,
} from "./libraryStore";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shop?: string | null;
  pageId?: string | null;
}

export default function GlobalsPanel({ open, onOpenChange, shop = null, pageId = null }: Props) {
  const [query, setQuery] = useState("");
  const [globals, setGlobals] = useState<GlobalItem[]>([]);
  const [pageGlobals, setPageGlobals] = useState<GlobalItem[]>([]);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState<string>("");

  // i18n-exempt — editor-only panel; wire into app i18n later
  /* i18n-exempt */
  const t = (s: string) => s;

  const refresh = useCallback(() => {
    setGlobals(listGlobals(shop));
    setPageGlobals(listGlobalsForPage(shop, pageId));
  }, [shop, pageId]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("pb-library-changed", onChange as EventListener);
    return () => window.removeEventListener("pb-library-changed", onChange as EventListener);
  }, [refresh]);

  const used = useMemo(() => new Set(pageGlobals.map((g) => g.globalId)), [pageGlobals]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return globals;
    return globals.filter((g) => g.label.toLowerCase().includes(q) || (g.tags || []).some((t) => t.toLowerCase().includes(q)));
  }, [globals, query]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent side="left" width={384} className="flex h-full flex-col overflow-hidden border-e p-0">
        <DialogHeader className="px-4 py-3">
          <DialogTitle>{t("Global Sections")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 flex-col gap-3 p-3 text-sm">
          <div className="space-y-1">
            <Input placeholder={t("Search globals…")} value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? t("item") : t("items")}</div>
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-2 text-muted-foreground">{t("No global sections yet.")}</div>
            )}
            <ul className="space-y-2">
              {filtered.map((g) => (
                <li key={g.globalId} className="rounded border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {renameId === g.globalId ? (
                        <div className="flex items-center gap-2">
                          <Input value={renameVal} onChange={(e) => setRenameVal(e.target.value)} className="h-7" />
                          <Button
                            variant="outline"
                            className="h-7"
                            onClick={async () => {
                              await updateGlobal(shop, g.globalId, { label: renameVal });
                              setRenameId(null);
                              setRenameVal("");
                              refresh();
                            }}
                          >{t("Save")}</Button>
                          <Button variant="ghost" className="h-7" onClick={() => { setRenameId(null); setRenameVal(""); }}>{t("Cancel")}</Button>
                        </div>
                      ) : (
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{g.label}</span>
                            {used.has(g.globalId) && (
                              <span className="rounded bg-primary/15 px-1 text-xs text-primary">{t("On this page")}</span>
                            )}
                          </div>
                          {g.tags && g.tags.length > 0 && (
                            <Inline className="mt-1 text-xs text-muted-foreground" gap={1}>
                              {g.tags.map((t) => (
                                <span key={t} className="rounded border px-1">{t}</span>
                              ))}
                            </Inline>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {used.has(g.globalId) ? (
                        <Tooltip text={t("Remove from this page")}>
                          <Button
                            variant="outline"
                            className="h-7 px-2"
                            onClick={async () => { await removeGlobalForPage(shop, pageId, g.globalId); refresh(); }}
                          >{t("Remove")}</Button>
                        </Tooltip>
                      ) : (
                        <Tooltip text={t("Add to this page")}>
                          <Button
                            variant="outline"
                            className="h-7 px-2"
                            onClick={async () => { await saveGlobalForPage(shop, pageId, g); refresh(); }}
                          >{t("Add")}</Button>
                        </Tooltip>
                      )}
                      <Tooltip text={t("Rename")}>
                        <Button variant="outline" className="h-7 px-2" onClick={() => { setRenameId(g.globalId); setRenameVal(g.label); }}>{t("Rename")}</Button>
                      </Tooltip>
                      <Tooltip text={t("Delete global")}>
                        <Button
                          variant="outline"
                          className="h-7 px-2"
                          onClick={async () => { await removeGlobal(shop, g.globalId); refresh(); }}
                        >{t("Delete")}</Button>
                      </Tooltip>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("Tip: Make any section global from the Inspector, then use this panel to add it to other pages. You can pin one global per page using the Inspector.")}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

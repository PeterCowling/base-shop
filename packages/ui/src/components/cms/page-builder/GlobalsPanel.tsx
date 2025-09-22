"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Input } from "../../atoms/shadcn";
import { Tooltip } from "../../atoms";
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

  const refresh = () => {
    setGlobals(listGlobals(shop));
    setPageGlobals(listGlobalsForPage(shop, pageId));
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("pb-library-changed", onChange as EventListener);
    return () => window.removeEventListener("pb-library-changed", onChange as EventListener);
  }, [shop, pageId]);

  const used = useMemo(() => new Set(pageGlobals.map((g) => g.globalId)), [pageGlobals]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return globals;
    return globals.filter((g) => g.label.toLowerCase().includes(q) || (g.tags || []).some((t) => t.toLowerCase().includes(q)));
  }, [globals, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-0 top-0 z-[60] h-screen w-[24rem] max-w-full -translate-x-full overflow-hidden border-r bg-surface-3 p-0 shadow-elevation-4 transition-transform data-[state=open]:translate-x-0">
        <DialogHeader className="px-4 py-3">
          <DialogTitle>Global Sections</DialogTitle>
        </DialogHeader>
        <div className="flex h-[calc(100%-3rem)] flex-col gap-3 p-3 text-sm">
          <div className="space-y-1">
            <Input placeholder="Search globals…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="text-xs text-muted-foreground">{filtered.length} item{filtered.length === 1 ? "" : "s"}</div>
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.length === 0 && (
              <div className="p-2 text-muted-foreground">No global sections yet.</div>
            )}
            <ul className="space-y-2">
              {filtered.map((g) => (
                <li key={g.globalId} className="rounded border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {renameId === g.globalId ? (
                        <div className="flex items-center gap-2">
                          <Input autoFocus value={renameVal} onChange={(e) => setRenameVal(e.target.value)} className="h-7" />
                          <Button
                            variant="outline"
                            className="h-7"
                            onClick={async () => {
                              await updateGlobal(shop, g.globalId, { label: renameVal });
                              setRenameId(null);
                              setRenameVal("");
                              refresh();
                            }}
                          >Save</Button>
                          <Button variant="ghost" className="h-7" onClick={() => { setRenameId(null); setRenameVal(""); }}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{g.label}</span>
                            {used.has(g.globalId) && (
                              <span className="rounded bg-emerald-500/15 px-1 text-[10px] text-emerald-700">On this page</span>
                            )}
                          </div>
                          {g.tags && g.tags.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                              {g.tags.map((t) => (
                                <span key={t} className="rounded border px-1">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {used.has(g.globalId) ? (
                        <Tooltip text="Remove from this page">
                          <Button
                            variant="outline"
                            className="h-7 px-2"
                            onClick={async () => { await removeGlobalForPage(shop, pageId, g.globalId); refresh(); }}
                          >Remove</Button>
                        </Tooltip>
                      ) : (
                        <Tooltip text="Add to this page">
                          <Button
                            variant="outline"
                            className="h-7 px-2"
                            onClick={async () => { await saveGlobalForPage(shop, pageId, g); refresh(); }}
                          >Add</Button>
                        </Tooltip>
                      )}
                      <Tooltip text="Rename">
                        <Button variant="outline" className="h-7 px-2" onClick={() => { setRenameId(g.globalId); setRenameVal(g.label); }}>Rename</Button>
                      </Tooltip>
                      <Tooltip text="Delete global">
                        <Button
                          variant="outline"
                          className="h-7 px-2"
                          onClick={async () => { await removeGlobal(shop, g.globalId); refresh(); }}
                        >Delete</Button>
                      </Tooltip>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-muted-foreground">
            Tip: Make any section global from the Inspector, then use this panel to add it to other pages. You can pin one global per page using the Inspector.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


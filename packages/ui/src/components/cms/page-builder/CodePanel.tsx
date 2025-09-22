"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button } from "../../atoms/shadcn";

type Tab = "page" | "public" | "backend" | "css";

function usePersisted(key: string, initial = "") {
  const [val, setVal] = useState<string>(() => {
    try { return localStorage.getItem(key) ?? initial; } catch { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, val); } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

interface Props { open: boolean; onOpenChange: (v: boolean) => void; shop?: string | null; pageId?: string | null; }

export default function CodePanel({ open, onOpenChange, shop = null, pageId = null }: Props) {
  const [tab, setTab] = useState<Tab>("page");
  const keyBase = useMemo(() => `pb-code-${shop || "default"}-${pageId || "page"}`, [shop, pageId]);
  const [pageCode, setPageCode] = usePersisted(`${keyBase}-page`, "// Page code (client)");
  const [publicCode, setPublicCode] = usePersisted(`${keyBase}-public`, "// Public code (shared)");
  const [backendCode, setBackendCode] = usePersisted(`${keyBase}-backend`, "// Backend code (server)");
  const [css, setCss] = usePersisted(`${keyBase}-css`, "/* Global CSS overrides */");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed right-0 top-0 z-[60] h-screen w-[40rem] max-w-full translate-x-full overflow-hidden border-l bg-surface-3 p-0 shadow-elevation-4 transition-transform data-[state=open]:translate-x-0">
        <DialogHeader className="px-4 py-3">
          <DialogTitle>Code</DialogTitle>
        </DialogHeader>
        <div className="flex h-[calc(100%-3rem)] flex-col">
          <div className="flex items-center gap-2 border-b p-2">
            <Button variant={tab === "page" ? "default" : "outline"} className="h-7 px-2" onClick={() => setTab("page")}>Page</Button>
            <Button variant={tab === "public" ? "default" : "outline"} className="h-7 px-2" onClick={() => setTab("public")}>Public</Button>
            <Button variant={tab === "backend" ? "default" : "outline"} className="h-7 px-2" onClick={() => setTab("backend")}>Backend</Button>
            <Button variant={tab === "css" ? "default" : "outline"} className="h-7 px-2" onClick={() => setTab("css")}>CSS</Button>
            <div className="ml-auto text-xs text-muted-foreground">Local draft only. Integrate with Git/IDE to sync.</div>
          </div>
          <div className="flex-1 overflow-auto p-2">
            {tab === "page" && (
              <textarea className="h-full w-full resize-none rounded border bg-background p-2 font-mono text-xs" value={pageCode} onChange={(e) => setPageCode(e.target.value)} />
            )}
            {tab === "public" && (
              <textarea className="h-full w-full resize-none rounded border bg-background p-2 font-mono text-xs" value={publicCode} onChange={(e) => setPublicCode(e.target.value)} />
            )}
            {tab === "backend" && (
              <textarea className="h-full w-full resize-none rounded border bg-background p-2 font-mono text-xs" value={backendCode} onChange={(e) => setBackendCode(e.target.value)} />
            )}
            {tab === "css" && (
              <textarea className="h-full w-full resize-none rounded border bg-background p-2 font-mono text-xs" value={css} onChange={(e) => setCss(e.target.value)} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageComponent } from "@acme/types";
import { Button, Dialog, DialogContent, DialogTitle, Input, Textarea } from "../../atoms/shadcn";

type Thread = {
  id: string;
  componentId: string;
  resolved: boolean;
  assignedTo?: string | null;
  messages: { id: string; text: string; ts: string }[];
  pos?: { x: number; y: number } | null;
};

interface Props {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  components: PageComponent[];
  shop: string;
  pageId: string;
  selectedIds: string[];
}

export default function CommentsLayer({ canvasRef, components, shop, pageId, selectedIds }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [showResolved, setShowResolved] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const positions = useRef<Record<string, { left: number; top: number; width: number; height: number }>>({});

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/cms/api/comments/${shop}/${pageId}`);
      const data = (await res.json()) as any[];
      setThreads(
        (data || []).map((t) => ({ id: t.id, componentId: t.componentId, resolved: !!t.resolved, assignedTo: t.assignedTo ?? null, messages: t.messages || [] }))
      );
    } catch (err) {
      setError((err as Error).message);
    }
  }, [shop, pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  const recalcPositions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const map: Record<string, { left: number; top: number; width: number; height: number }> = {};
    const all = canvas.querySelectorAll<HTMLElement>("[data-component-id]");
    all.forEach((el) => {
      const id = el.getAttribute("data-component-id");
      if (!id) return;
      const r = el.getBoundingClientRect();
      map[id] = { left: Math.max(0, r.left - canvasRect.left), top: Math.max(0, r.top - canvasRect.top), width: r.width, height: r.height };
    });
    positions.current = map;
  }, [canvasRef]);

  useEffect(() => {
    recalcPositions();
    const handle = () => recalcPositions();
    window.addEventListener("resize", handle);
    const t = setInterval(handle, 500);
    return () => {
      window.removeEventListener("resize", handle);
      clearInterval(t);
    };
  }, [recalcPositions, components]);

  // Drag handlers for repositioning pins
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragId) return;
      const thread = threads.find((t) => t.id === dragId);
      if (!thread) return;
      const comp = positions.current[thread.componentId];
      const canvas = canvasRef.current;
      if (!comp || !canvas) return;
      const canvasRect = canvas.getBoundingClientRect();
      const clientX = e.clientX - canvasRect.left - comp.left;
      const clientY = e.clientY - canvasRect.top - comp.top;
      const x = Math.min(1, Math.max(0, clientX / Math.max(1, comp.width)));
      const y = Math.min(1, Math.max(0, clientY / Math.max(1, comp.height)));
      setDragPos({ x, y });
    };
    const onUp = async () => {
      if (dragId && dragPos) {
        await patch(dragId, { pos: dragPos });
      }
      setDragId(null);
      setDragPos(null);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp, true);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp, true);
    };
  }, [dragId, dragPos, threads]);

  const open = (id: string) => {
    setOpenId(id);
    setNewText("");
    setAssignTo("");
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/cms/api/comments/${shop}/${pageId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  };

  const addMessage = async () => {
    const id = openId;
    if (!id || !newText.trim()) return;
    await patch(id, { action: "addMessage", text: newText.trim() });
    setNewText("");
  };

  const toggleResolved = async (id: string, resolved: boolean) => {
    await patch(id, { resolved });
  };

  const startNewForSelected = async () => {
    const id = selectedIds[0];
    if (!id) return;
    // Minimal UX: prompt for text
    const text = window.prompt("Comment for selected component:");
    if (!text || !text.trim()) return;
    await fetch(`/cms/api/comments/${shop}/${pageId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentId: id, text: text.trim(), assignedTo: assignTo || undefined }),
    });
    await load();
  };

  // Alt+Click to create a pin at position within component
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = async (e: MouseEvent) => {
      if (!(e instanceof MouseEvent)) return;
      if (!e.altKey || e.button !== 0) return; // alt+left click only
      const target = (e.target as HTMLElement | null)?.closest('[data-component-id]') as HTMLElement | null;
      if (!target) return;
      const compId = target.getAttribute('data-component-id');
      if (!compId) return;
      const rect = target.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(1, rect.width);
      const y = (e.clientY - rect.top) / Math.max(1, rect.height);
      const text = window.prompt("Comment:");
      if (!text || !text.trim()) return;
      await fetch(`/cms/api/comments/${shop}/${pageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ componentId: compId, text: text.trim(), pos: { x, y } }),
      });
      await load();
      e.preventDefault();
      e.stopPropagation();
    };
    canvas.addEventListener('click', handler, true);
    return () => canvas.removeEventListener('click', handler, true);
  }, [canvasRef, load, shop, pageId]);

  const visibleThreads = useMemo(() => threads.filter((t) => showResolved || !t.resolved), [threads, showResolved]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {/* Toolbar */}
      <div className="pointer-events-auto absolute right-2 top-2 flex items-center gap-2 rounded bg-muted/60 px-2 py-1 text-xs">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
        <Button variant="outline" onClick={() => void load()} className="h-6 px-2 py-0 text-xs">Reload</Button>
        <Button variant="outline" onClick={startNewForSelected} disabled={!selectedIds.length} className="h-6 px-2 py-0 text-xs">Add for selected</Button>
      </div>

      {/* Pins */}
      {visibleThreads.map((t, i) => {
        const comp = positions.current[t.componentId];
        if (!comp) return null;
        const isDragging = dragId === t.id && !!dragPos;
        const rel = isDragging ? dragPos! : (t.pos ?? null);
        const pinLeft = comp.left + (rel ? (rel.x * comp.width) : 8);
        const pinTop = comp.top + (rel ? (rel.y * comp.height) : 8);
        return (
          <button
            key={t.id}
            type="button"
            className={`pointer-events-auto absolute -translate-y-1/2 translate-x-1/2 rounded-full border px-2 py-1 text-xs shadow ${t.resolved ? "bg-green-200" : "bg-amber-200"}`}
            style={{ left: pinLeft, top: pinTop, cursor: "grab" }}
            onMouseDown={(e) => { if (e.button === 0) { setDragId(t.id); e.preventDefault(); e.stopPropagation(); } }}
            onClick={() => open(t.id)}
            title={`Comment on ${t.componentId}`}
          >
            {i + 1}
          </button>
        );
      })}

      {/* Per-component badge counts */}
      {(() => {
        const counts = new Map<string, number>();
        threads.forEach((t) => counts.set(t.componentId, (counts.get(t.componentId) ?? 0) + (t.resolved ? 0 : 1)));
        return Array.from(counts.entries()).map(([cid, count]) => {
          if (!count) return null;
          const comp = positions.current[cid];
          if (!comp) return null;
          return (
            <div
              key={`badge-${cid}`}
              className="pointer-events-none absolute flex h-5 w-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
              style={{ left: comp.left + comp.width - 6, top: comp.top + 6 }}
              title={`${count} unresolved comments`}
            >
              {count}
            </div>
          );
        });
      })()}

      {/* Thread dialog */}
      <Dialog open={!!openId} onOpenChange={(v) => setOpenId(v ? openId : null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Comment</DialogTitle>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {(() => {
            const t = threads.find((x) => x.id === openId);
            if (!t) return <div className="text-sm text-muted-foreground">Missing thread</div>;
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Component: <code className="text-xs">{t.componentId}</code></div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={t.resolved} onChange={(e) => void toggleResolved(t.id, e.target.checked)} />
                    Resolved
                  </label>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded border p-2 text-sm">
                  {t.messages.map((m) => (
                    <div key={m.id} className="rounded bg-muted p-2">
                      <div className="text-xs text-muted-foreground">{new Date(m.ts).toLocaleString()}</div>
                      <div>{m.text}</div>
                    </div>
                  ))}
                  {t.messages.length === 0 && (
                    <div className="text-muted-foreground">No messages</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Textarea placeholder="Reply" value={newText} onChange={(e) => setNewText(e.target.value)} />
                  <div className="flex justify-end">
                    <Button onClick={addMessage} disabled={!newText.trim()}>Add Reply</Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Assign to</label>
                  <Input placeholder="name or email" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} onBlur={() => void patch(t.id, { assignedTo: assignTo || null })} />
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

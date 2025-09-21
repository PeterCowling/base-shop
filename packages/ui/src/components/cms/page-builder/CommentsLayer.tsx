"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PageComponent } from "@acme/types";
import { Button } from "../../atoms/shadcn";
import CommentsDrawer from "./CommentsDrawer";
import { useSession } from "next-auth/react";
import usePresence from "./collab/usePresence";

type Thread = {
  id: string;
  componentId: string;
  resolved: boolean;
  assignedTo?: string | null;
  messages: { id: string; text: string; ts: string }[];
  pos?: { x: number; y: number } | null;
  createdAt?: string;
  updatedAt?: string;
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
  // const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showResolved, setShowResolved] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [mentionPeople, setMentionPeople] = useState<string[]>([]);
  const [lastDeleted, setLastDeleted] = useState<Thread | null>(null);

  const positions = useRef<Record<string, { left: number; top: number; width: number; height: number }>>({});
  const { data: session } = useSession();
  const meId = (session?.user?.email as string | undefined) ?? (session?.user?.name as string | undefined) ?? "me";
  const meLabel = (session?.user?.name as string | undefined) ?? (session?.user?.email as string | undefined) ?? "Me";
  const { peers } = usePresence({ shop, pageId, meId, label: meLabel, selectedIds, editingId: selectedIds[0] ?? null });

  const load = useCallback(async () => {
    try {
      // setError(null);
      const res = await fetch(`/cms/api/comments/${shop}/${pageId}`);
      const data = (await res.json()) as any[];
      setThreads(
        (data || []).map((t) => ({
          id: t.id,
          componentId: t.componentId,
          resolved: !!t.resolved,
          assignedTo: t.assignedTo ?? null,
          messages: t.messages || [],
          pos: t.pos ?? null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
      );
    } catch {
      // ignore load errors (toolbar has manual Reload)
    }
  }, [shop, pageId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Load RBAC users/handles for @mentions
  useEffect(() => {
    const doFetch = async () => {
      try {
        const res = await fetch(`/cms/api/rbac/users`);
        const data = await res.json();
        const arr: string[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : [];
        setMentionPeople(arr.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()));
      } catch {
        // ignore
      }
    };
    void doFetch();
  }, []);

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
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/cms/api/comments/${shop}/${pageId}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await load();
  };

  const addMessage = async (id: string, text: string) => {
    if (!id || !text.trim()) return;
    await patch(id, { action: "addMessage", text: text.trim() });
  };

  const toggleResolved = async (id: string, resolved: boolean) => {
    await patch(id, { resolved });
  };

  const assign = async (id: string, assignee: string | null) => {
    await patch(id, { assignedTo: assignee ?? null });
  };

  const del = async (id: string) => {
    const t = threads.find((x) => x.id === id) || null;
    setLastDeleted(t);
    await fetch(`/cms/api/comments/${shop}/${pageId}/${id}`, { method: "DELETE" });
    await load();
    if (selectedId === id) setSelectedId(null);
  };

  const jumpTo = (componentId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const el = canvas.querySelector(`[data-component-id="${componentId}"]`) as HTMLElement | null;
    if (!el) return;
    try {
      el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    } catch {}
    const prevOutline = el.style.outline;
    const prevOffset = el.style.outlineOffset;
    el.classList.add("ring-2", "ring-primary");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-primary");
      el.style.outline = prevOutline;
      el.style.outlineOffset = prevOffset;
    }, 1200);
  };

  const restoreLastDeleted = async () => {
    const t = lastDeleted;
    if (!t) return;
    const first = t.messages[0]?.text || "Restored";
    const res = await fetch(`/cms/api/comments/${shop}/${pageId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ componentId: t.componentId, text: first, assignedTo: t.assignedTo ?? undefined, pos: t.pos ?? undefined }),
    });
    const created = await res.json();
    if (res.ok && created?.id) {
      const newId: string = created.id;
      for (let i = 1; i < (t.messages?.length ?? 0); i++) {
        const m = t.messages[i];
        try {
          // eslint-disable-next-line no-await-in-loop
          await fetch(`/cms/api/comments/${shop}/${pageId}/${newId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "addMessage", text: m.text }),
          });
        } catch {}
      }
      if (t.resolved) {
        await fetch(`/cms/api/comments/${shop}/${pageId}/${newId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved: true }),
        });
      }
      await load();
      setSelectedId(newId);
      setDrawerOpen(true);
    }
    setLastDeleted(null);
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
      body: JSON.stringify({ componentId: id, text: text.trim() }),
    });
    await load();
    setDrawerOpen(true);
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
        {/* Presence summary */}
        <div className="flex items-center gap-1 pr-1 border-r">
          {peers.slice(0, 3).map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 rounded px-1 py-0.5" title={`${p.label} online`} style={{ backgroundColor: `${p.color}20`, color: "inherit" }}>
              <span aria-hidden className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="max-w-[6rem] truncate">{p.label}</span>
            </span>
          ))}
          {peers.length > 3 && (
            <span className="text-muted-foreground">+{peers.length - 3} more</span>
          )}
        </div>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
          Show resolved
        </label>
        <Button variant="outline" onClick={() => void load()} className="h-6 px-2 py-0 text-xs">Reload</Button>
        <Button variant="outline" onClick={startNewForSelected} disabled={!selectedIds.length} className="h-6 px-2 py-0 text-xs">Add for selected</Button>
        <Button variant="default" onClick={() => setDrawerOpen((v) => !v)} className="h-6 px-2 py-0 text-xs">
          Comments ({threads.filter((t) => !t.resolved).length})
        </Button>
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

      {/* Right Drawer */}
      <CommentsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        threads={threads}
        selectedId={selectedId}
        onSelect={(id) => {
          setSelectedId(id);
          const t = threads.find((x) => x.id === id);
          if (t) jumpTo(t.componentId);
        }}
        onAddMessage={(id, text) => addMessage(id, text).then(() => load())}
        onToggleResolved={(id, resolved) => toggleResolved(id, resolved)}
        onAssign={(id, who) => assign(id, who)}
        onDelete={(id) => del(id)}
        onJumpTo={(componentId) => jumpTo(componentId)}
        componentsOptions={(() => {
          const openCounts = new Map<string, number>();
          threads.forEach((t) => openCounts.set(t.componentId, (openCounts.get(t.componentId) ?? 0) + (t.resolved ? 0 : 1)));
          // helper to find type by id
          const findType = (list: PageComponent[], id: string): string | null => {
            for (const c of list) {
              if ((c as any).id === id) return (c as any).type ?? null;
              const children = (c as any).children as PageComponent[] | undefined;
              if (Array.isArray(children)) {
                const t = findType(children, id);
                if (t) return t;
              }
            }
            return null;
          };
          const ids = Object.keys(positions.current);
          return ids.map((id) => {
            const type = findType(components, id);
            const cnt = openCounts.get(id) ?? 0;
            const suffix = cnt ? ` (${cnt} open)` : "";
            const base = type ? `${type}` : "Component";
            return { id, label: `${base} • ${id.slice(-4)}${suffix}` };
          });
        })()}
        onCreate={async (componentId, text, assignedTo) => {
          const res = await fetch(`/cms/api/comments/${shop}/${pageId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ componentId, text, assignedTo: assignedTo ?? undefined }),
          });
          const json = await res.json();
          await load();
          if (res.ok && json?.id) {
            setSelectedId(json.id as string);
            setDrawerOpen(true);
          }
        }}
        shop={shop}
        mentionPeople={mentionPeople}
        me={(session?.user?.email as string | undefined) ?? (session?.user?.name as string | undefined) ?? null}
      />

      {lastDeleted && (
        <div className="pointer-events-auto fixed bottom-3 right-3 z-[70] flex items-center gap-3 rounded border bg-background px-3 py-2 shadow">
          <span className="text-sm">Thread deleted</span>
          <Button variant="outline" className="h-7 px-2 text-xs" onClick={() => void restoreLastDeleted()}>
            Restore
          </Button>
          <Button variant="ghost" className="h-7 px-2 text-xs" onClick={() => setLastDeleted(null)}>
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );
}

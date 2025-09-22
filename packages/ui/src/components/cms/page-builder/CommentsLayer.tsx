"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PageComponent } from "@acme/types";
import CommentsDrawer from "./CommentsDrawer";
import { useSession } from "next-auth/react";
import usePresence from "./collab/usePresence";
import type { Thread } from "./comments/types";
import { useCommentsApi } from "./comments/useCommentsApi";
import { usePositions } from "./comments/usePositions";
import { useDragPins } from "./comments/useDragPins";
import { useMentionPeople } from "./comments/useMentionPeople";
import CommentsToolbar from "./comments/CommentsToolbar";
import CommentsPinsLayer from "./comments/CommentsPinsLayer";
import UndoToast from "./comments/UndoToast";
import useAltClickCreate from "./comments/useAltClickCreate";

interface Props {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  components: PageComponent[];
  shop: string;
  pageId: string;
  selectedIds: string[];
}

export default function CommentsLayer({ canvasRef, components, shop, pageId, selectedIds }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showResolved, setShowResolved] = useState(true);
  const [lastDeleted, setLastDeleted] = useState<Thread | null>(null);

  const { positions } = usePositions(canvasRef, [components]);

  const { data: session } = useSession();
  const meId = (session?.user?.email as string | undefined) ?? (session?.user?.name as string | undefined) ?? "me";
  const meLabel = (session?.user?.name as string | undefined) ?? (session?.user?.email as string | undefined) ?? "Me";
  const { peers } = usePresence({ shop, pageId, meId, label: meLabel, selectedIds, editingId: selectedIds[0] ?? null });

  const { loadThreads, patchThread, deleteThread, createThread } = useCommentsApi(shop, pageId);

  const load = useCallback(async () => {
    try {
      setThreads(await loadThreads());
    } catch {
      // ignore load errors (toolbar has manual Reload)
    }
  }, [loadThreads]);

  useEffect(() => {
    void load();
  }, [load]);

  const mentionPeople = useMentionPeople();

  const { dragId, dragPos, startDrag } = useDragPins(canvasRef, positions, threads, async (id, body) => {
    await patchThread(id, body);
    await load();
  });

  const open = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  // External toggle support (bottom-left launcher)
  useEffect(() => {
    const toggle = () => setDrawerOpen((v) => !v);
    window.addEventListener("pb:toggle-comments", toggle as EventListener);
    return () => window.removeEventListener("pb:toggle-comments", toggle as EventListener);
  }, []);

  const addMessage = async (id: string, text: string) => {
    if (!id || !text.trim()) return;
    await patchThread(id, { action: "addMessage", text: text.trim() });
  };

  const toggleResolved = async (id: string, resolved: boolean) => {
    await patchThread(id, { resolved });
  };

  const assign = async (id: string, assignee: string | null) => {
    await patchThread(id, { assignedTo: assignee ?? null });
  };

  const del = async (id: string) => {
    const t = threads.find((x) => x.id === id) || null;
    setLastDeleted(t);
    await deleteThread(id);
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
    const created = await createThread(t.componentId, first, { assignedTo: t.assignedTo ?? undefined, pos: t.pos ?? undefined });
    if (created.ok && created?.json?.id) {
      const newId: string = created.json.id;
      for (let i = 1; i < (t.messages?.length ?? 0); i++) {
        const m = t.messages[i];
        try {
          await patchThread(newId, { action: "addMessage", text: m.text });
        } catch {}
      }
      if (t.resolved) {
        await patchThread(newId, { resolved: true });
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
    await createThread(id, text.trim());
    await load();
    setDrawerOpen(true);
  };

  // Alt+Click to create a pin at position within component
  useAltClickCreate(canvasRef, createThread, load);

  const visibleThreads = useMemo(() => threads.filter((t) => showResolved || !t.resolved), [threads, showResolved]);

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      <CommentsToolbar
        peers={peers}
        showResolved={showResolved}
        onShowResolvedChange={setShowResolved}
        onReload={load}
        onAddForSelected={startNewForSelected}
        canAddForSelected={!!selectedIds.length}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
        unresolvedCount={threads.filter((t) => !t.resolved).length}
      />

      {/* Local portal root so dropdowns/menus inherit canvas preview tokens */}
      <div data-pb-portal-root className="absolute inset-0 z-50 pointer-events-none" />

      {/* Pins + per-component badges */}
      <CommentsPinsLayer
        threads={threads}
        visibleThreads={visibleThreads}
        positionsRef={positions}
        dragId={dragId}
        dragPos={dragPos}
        onStartDrag={(id) => startDrag(id)}
        onOpen={(id) => open(id)}
      />

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
          const { ok, json } = await createThread(componentId, text, { assignedTo: assignedTo ?? undefined });
          await load();
          if (ok && json?.id) {
            setSelectedId(json.id as string);
            setDrawerOpen(true);
          }
        }}
        shop={shop}
        mentionPeople={mentionPeople}
        me={(session?.user?.email as string | undefined) ?? (session?.user?.name as string | undefined) ?? null}
      />

      <UndoToast lastDeleted={lastDeleted} onRestore={() => void restoreLastDeleted()} onDismiss={() => setLastDeleted(null)} />
    </div>
  );
}

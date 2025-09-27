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
  onSelectIds?: (ids: string[]) => void;
}

export default function CommentsLayer({ canvasRef, components, shop, pageId, selectedIds, onSelectIds }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showResolved, setShowResolved] = useState(true);
  const [lastDeleted, setLastDeleted] = useState<Thread | null>(null);

  const { positions } = usePositions(canvasRef, [components]);

  const { data: session } = useSession();
  // i18n-exempt: developer default identifiers
  const meId = (session?.user?.email as string | undefined) ?? (session?.user?.name as string | undefined) ?? "me";
  // i18n-exempt: developer default labels
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

  const patchThreadSafely = useCallback(
    async (id: string, body: Record<string, unknown>, options?: { reload?: boolean }) => {
      try {
        await patchThread(id, body);
        if (options?.reload) {
          await load();
        }
      } catch (error) {
        // i18n-exempt: developer log message
        console.error("Failed to patch comment thread", error);
      }
    },
    [patchThread, load]
  );

  const patchPosition = useCallback(
    async (id: string, body: Record<string, unknown>) => {
      await patchThreadSafely(id, body, { reload: true });
    },
    [patchThreadSafely]
  );

  const { dragId, dragPos, startDrag } = useDragPins(canvasRef, positions, threads, patchPosition);

  const open = (id: string) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  // External open support for a specific thread id
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ id?: string }>;
        const id = ce?.detail?.id;
        if (id) open(id);
      } catch {}
    };
    window.addEventListener('pb:open-comment', handler as EventListener);
    return () => window.removeEventListener('pb:open-comment', handler as EventListener);
  }, []);

  // External toggle support (bottom-left launcher)
  useEffect(() => {
    const toggle = () => setDrawerOpen((v) => !v);
    window.addEventListener("pb:toggle-comments", toggle as EventListener);
    return () => window.removeEventListener("pb:toggle-comments", toggle as EventListener);
  }, []);

  const addMessage = async (id: string, text: string) => {
    if (!id || !text.trim()) return;
    await patchThreadSafely(id, { action: "addMessage", text: text.trim() }, { reload: true });
  };

  const toggleResolved = async (id: string, resolved: boolean) => {
    await patchThreadSafely(id, { resolved }, { reload: true });
  };

  const assign = async (id: string, assignee: string | null) => {
    await patchThreadSafely(id, { assignedTo: assignee ?? null }, { reload: true });
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
    // Also select the component in the editor when jumping
    try { onSelectIds?.([componentId]); } catch {}
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
    // i18n-exempt: fallback system text for undo
    const first = t.messages[0]?.text || "Restored";
    const created = await createThread(t.componentId, first, { assignedTo: t.assignedTo ?? undefined, pos: t.pos ?? undefined });
    if (created.ok) {
      const data = created.json as { id?: string };
      const newId: string = String(data?.id ?? "");
      if (!newId) return;
      for (let i = 1; i < (t.messages?.length ?? 0); i++) {
        const m = t.messages[i];
        await patchThreadSafely(newId, { action: "addMessage", text: m.text });
      }
      if (t.resolved) {
        await patchThreadSafely(newId, { resolved: true });
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
    // i18n-exempt: prompt copy for internal tool
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
    <div className="relative">
      <div className="pointer-events-none absolute inset-0">
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
      <div data-pb-portal-root className="absolute inset-0 pointer-events-none" />

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
        onAddMessage={(id, text) => addMessage(id, text)}
        onToggleResolved={(id, resolved) => toggleResolved(id, resolved)}
        onAssign={(id, who) => assign(id, who)}
        onDelete={(id) => del(id)}
        onJumpTo={(componentId) => jumpTo(componentId)}
        componentsOptions={(() => {
          const openCounts = new Map<string, number>();
          threads.forEach((t) => openCounts.set(t.componentId, (openCounts.get(t.componentId) ?? 0) + (t.resolved ? 0 : 1)));
          // helper to find type by id (avoid `any`)
          const findType = (list: PageComponent[], id: string): string | null => {
            for (const c of list) {
              if (c.id === id) return c.type ?? null;
              const children = (c as unknown as { children?: PageComponent[] }).children;
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
            // i18n-exempt: internal builder label formatting
            const suffix = cnt ? ` (${cnt} open)` : "";
            // i18n-exempt: internal builder label fallback
            const base = type ? `${type}` : "Component";
            return { id, label: `${base} • ${id.slice(-4)}${suffix}` };
          });
        })()}
        onCreate={async (componentId, text, assignedTo) => {
          const { ok, json } = await createThread(componentId, text, { assignedTo: assignedTo ?? undefined });
          await load();
          const data = json as { id?: string };
          if (ok && data?.id) {
            setSelectedId(String(data.id));
            setDrawerOpen(true);
          }
        }}
        shop={shop}
        mentionPeople={mentionPeople}
        me={(session?.user?.email as string | undefined) ?? (session?.user?.name as string | undefined) ?? null}
      />

      <UndoToast lastDeleted={lastDeleted} onRestore={() => void restoreLastDeleted()} onDismiss={() => setLastDeleted(null)} />
      </div>
    </div>
  );
}

"use client";

import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent, useDroppable } from "@dnd-kit/core";
import { EyeOpenIcon, EyeClosedIcon, LockClosedIcon, LockOpen2Icon } from "@radix-ui/react-icons";
import { SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PageComponent, HistoryState } from "@acme/types";
import type { EditorFlags } from "./state/layout/types";
import { isHiddenForViewport } from "./state/layout/utils";
import { applyDesktopOrderAcrossBreakpoints } from "./utils/applyDesktopOrder";
import type { Action } from "./state";
import { useMemo, useState, useCallback } from "react";
import { Inline } from "../../atoms/primitives/Inline";
import { Cluster } from "../../atoms/primitives/Cluster";
import { Stack } from "../../atoms/primitives/Stack";

interface LayersPanelProps {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  dispatch: (action: Action) => void;
  editor?: HistoryState["editor"];
  viewport?: "desktop" | "tablet" | "mobile";
  crossNotices?: boolean;
}

type Node = PageComponent & {
  children?: PageComponent[];
  // Optional builder-derived flags we attach for view rendering
  name?: string;
  hidden?: boolean;
  locked?: boolean;
  __isGlobal?: boolean;
  __hasOverride?: boolean;
};

function useSelectionHandlers(selectedIds: string[], onSelectIds: (ids: string[]) => void) {
  return useCallback(
    (id: string, e?: React.MouseEvent) => {
      if (e?.metaKey || e?.ctrlKey || e?.shiftKey) {
        const exists = selectedIds.includes(id);
        onSelectIds(exists ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]);
      } else {
        onSelectIds([id]);
        // Move focus to the selected canvas item for predictable keyboard flow
        setTimeout(() => {
          const el = document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null;
          el?.focus?.();
        }, 0);
      }
    },
    [selectedIds, onSelectIds]
  );
}

function SortableRow({ node, index, parentId, selected, onSelect, onToggleHidden, onToggleLocked, onRename }: {
  node: Node;
  index: number;
  parentId?: string;
  selected: boolean;
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
  onRename: (id: string, name: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    data: { index, parentId },
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name ?? "");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // i18n-exempt: Styling string, not user-facing copy.
      className={
        "group flex items-center justify-between rounded px-2 py-1 text-sm" + // i18n-exempt: className string
        (selected ? " bg-primary/10" : "") // i18n-exempt: className string
      }
      onClick={(e) => onSelect(node.id, e)}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-pressed={isDragging}
    >
      <div className="flex items-center gap-2 truncate">
        {/* i18n-exempt: Decorative drag handle glyph for builder UI. */}
        <span className="cursor-grab">⋮⋮</span>
        {editing ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              setEditing(false);
              onRename(node.id, name);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-28 rounded border px-1 text-xs"
          />
        ) : (
          <>
            <span className={`truncate ${node.hidden ? "opacity-50" : ""}`} onDoubleClick={() => setEditing(true)}>
              {node.name ?? node.type}
            </span>
            {/* Global/Override badges */}
            {node.__isGlobal && (
              // i18n-exempt: Admin-only CMS tool UI copy.
              <span className="ms-2 rounded bg-green-500/15 px-1 text-xs text-green-700" title="Global section">Global</span>
            )}
            {node.__hasOverride && (
              // i18n-exempt: Admin-only CMS tool UI copy.
              <span className="ms-1 rounded bg-amber-500/15 px-1 text-xs text-amber-700" title="Breakpoint override">Override</span>
            )}
          </>
        )}
      </div>
      <Inline gap={1} alignY="center">
        <button
          type="button"
          className="min-h-10 min-w-10 rounded border px-2 py-1 text-xs hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          // i18n-exempt: Admin-only CMS tool UI copy.
          aria-label={node.hidden ? "Show layer" : "Hide layer"}
          // i18n-exempt: Admin-only CMS tool UI copy.
          title={node.hidden ? "Show" : "Hide"}
          onClick={(e) => { e.stopPropagation(); onToggleHidden(node.id, !node.hidden); }}
        >
          {node.hidden ? <EyeOpenIcon /> : <EyeClosedIcon />}
        </button>
        <button
          type="button"
          className="min-h-10 min-w-10 rounded border px-2 py-1 text-xs hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          // i18n-exempt: Admin-only CMS tool UI copy.
          aria-label={node.locked ? "Unlock layer" : "Lock layer"}
          // i18n-exempt: Admin-only CMS tool UI copy.
          title={node.locked ? "Unlock" : "Lock"}
          onClick={(e) => { e.stopPropagation(); onToggleLocked(node.id, !node.locked); }}
        >
          {node.locked ? <LockOpen2Icon /> : <LockClosedIcon />}
        </button>
      </Inline>
    </div>
  );
}

function LayerList({ nodes, parentId, selectedIds, onSelect, onToggleHidden, onToggleLocked, onRename, collapsed, setCollapsed }: {
  nodes: Node[];
  parentId?: string;
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
  onRename: (id: string, name: string) => void;
  collapsed: Set<string>;
  setCollapsed: (updater: (prev: Set<string>) => Set<string>) => void;
}) {
  const items = nodes.map((n) => n.id);
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      <Stack gap={1}>
        {nodes.map((n, i) => {
          const hasChildren = Array.isArray(n.children) && n.children.length > 0;
          const isCollapsed = collapsed.has(n.id);
          return (
            <div key={n.id} className="space-y-1">
              <Inline gap={1} alignY="center">
                {hasChildren && (
                  <button
                    type="button"
                    className="min-h-10 min-w-10 rounded border px-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCollapsed((prev) => {
                        const next = new Set(prev);
                        if (next.has(n.id)) next.delete(n.id);
                        else next.add(n.id);
                        return next;
                      });
                    }}
                  >
                    {isCollapsed ? "+" : "−"}
                  </button>
                )}
                <SortableRow
                  node={n}
                  index={i}
                  parentId={parentId}
                  selected={selectedIds.includes(n.id)}
                  onSelect={onSelect}
                  onToggleHidden={onToggleHidden}
                  onToggleLocked={onToggleLocked}
                  onRename={onRename}
                />
              </Inline>
              {hasChildren && !isCollapsed && (
                <LayerChildren
                  parent={n}
                  selectedIds={selectedIds}
                  onSelect={onSelect}
                  onToggleHidden={onToggleHidden}
                  onToggleLocked={onToggleLocked}
                  onRename={onRename}
                  collapsed={collapsed}
                  setCollapsed={setCollapsed}
                />
              )}
            </div>
          );
        })}
      </Stack>
    </SortableContext>
  );
}

function LayerChildren({ parent, selectedIds, onSelect, onToggleHidden, onToggleLocked, onRename, collapsed, setCollapsed }: {
  parent: Node;
  selectedIds: string[];
  onSelect: (id: string, e?: React.MouseEvent) => void;
  onToggleHidden: (id: string, hidden: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
  onRename: (id: string, name: string) => void;
  collapsed: Set<string>;
  setCollapsed: (updater: (prev: Set<string>) => Set<string>) => void;
}) {
  const children = (parent.children ?? []) as Node[];
  const { setNodeRef, isOver } = useDroppable({ id: `layer-container-${parent.id}`, data: { parentId: parent.id, index: children.length } });
  return (
    <div className="ms-4">
      <div ref={setNodeRef} className={`rounded border border-dashed px-2 py-1 ${isOver ? 'border-primary' : 'border-transparent'}`}>
        <LayerList
          nodes={children}
          parentId={parent.id}
          selectedIds={selectedIds}
          onSelect={onSelect}
          onToggleHidden={onToggleHidden}
          onToggleLocked={onToggleLocked}
          onRename={onRename}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>
    </div>
  );
}

export default function LayersPanel({ components, selectedIds, onSelectIds, dispatch, editor, viewport = "desktop", crossNotices = true }: LayersPanelProps) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onSelect = useSelectionHandlers(selectedIds, onSelectIds);

  const visible = useMemo(() => {
    const decorate = (n: Node): Node => {
      const flags: EditorFlags | undefined = (editor ?? {})[n.id];
      const children = Array.isArray(n.children) ? (n.children as Node[]).map(decorate) : undefined;
      const hiddenBase = (n as { hidden?: boolean }).hidden;
      const hidden = isHiddenForViewport(n.id, editor, hiddenBase, viewport);
      const name = flags?.name;
      const isGlobal = !!flags?.global?.id;
      // Heuristic: mark as override if component has any viewport-specific props for current viewport
      const hasVpOverride = (() => {
        if (!crossNotices) return false;
        const suffix = viewport === 'mobile' ? 'Mobile' : viewport === 'tablet' ? 'Tablet' : 'Desktop';
        const keys = Object.keys((n as Record<string, unknown>) || {});
        return keys.some((k) => k.endsWith(suffix));
      })();
      return { ...n, ...(children ? { children } : {}), ...(name !== undefined ? { name } : {}), hidden, __isGlobal: isGlobal, __hasOverride: hasVpOverride } as Node;
    };
    const baseNodes = (components as Node[]).map(decorate);
    if (!search) return baseNodes;
    const query = search.toLowerCase();
    const filterTree = (nodes: Node[]): Node[] =>
      nodes
        .map((n) => {
          const name = String((n.name ?? n.type)).toLowerCase();
          const children = Array.isArray(n.children) ? filterTree(n.children as Node[]) : undefined;
          const match = name.includes(query) || (children && children.length > 0);
          if (!match) return null;
          return { ...n, children } as Node;
        })
        .filter(Boolean) as Node[];
    return filterTree(baseNodes);
  }, [components, editor, viewport, search, crossNotices]);

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over) return;
    const a = active.data.current as { index: number; parentId?: string };
    const o = over.data.current as { index: number; parentId?: string };
    if (!a || !o) return;
    // same parent reordering
    if (a.parentId === o.parentId) {
      let toIndex = o.index;
      if (a.index < o.index) toIndex = o.index - 1;
      dispatch({ type: "move", from: { parentId: a.parentId, index: a.index }, to: { parentId: o.parentId, index: toIndex } });
      return;
    }
    // moving across parents
    dispatch({ type: "move", from: { parentId: a.parentId, index: a.index }, to: { parentId: o.parentId, index: o.index } });
  };

  return (
    <div className="space-y-2">
      <Cluster gap={2} justify="between" alignY="center">
        {/* i18n-exempt: Admin-only CMS tool UI copy. */}
        <h3 className="text-sm font-semibold">Layers</h3>
        <button
          type="button"
          className="min-h-10 min-w-10 rounded border px-2 py-1 text-xs hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          // i18n-exempt: Admin-only CMS tool UI copy.
          title="Apply current desktop order to Tablet and Mobile"
          onClick={() => {
            try { applyDesktopOrderAcrossBreakpoints(components, editor, dispatch); } catch {}
          }}
        >
          {/* i18n-exempt: Admin-only CMS tool UI copy. */}
          Use Section Order on all Breakpoints
        </button>
      </Cluster>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        // i18n-exempt: Admin-only CMS tool UI copy.
        placeholder="Search layers..."
        className="w-full rounded border p-1 text-sm"
        // i18n-exempt: Admin-only CMS tool UI copy.
        aria-label="Search layers"
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {/* Root drop zone for moving to top-level */}
        <div className="rounded border border-dashed p-1">
          <RootDropZone topLevelCount={(visible as Node[]).length} />
          <LayerList
            nodes={visible as Node[]}
            selectedIds={selectedIds}
            onSelect={onSelect}
            onToggleHidden={(id, hidden) => {
              const cur = (editor ?? {})[id]?.hidden ?? [];
              const set = new Set(cur);
              if (hidden) set.add(viewport);
              else set.delete(viewport);
              dispatch({ type: "update-editor", id, patch: { hidden: Array.from(set) } as Partial<EditorFlags> });
            }}
            onToggleLocked={(id, locked) => dispatch({ type: "update-editor", id, patch: { locked } as Partial<EditorFlags> })}
            onRename={(id, name) => dispatch({ type: "update-editor", id, patch: { name } as Partial<EditorFlags> })}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </div>
      </DndContext>
    </div>
  );
}

function RootDropZone({ topLevelCount }: { topLevelCount: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `layer-root`, data: { parentId: undefined, index: topLevelCount } });
  return (
    <div ref={setNodeRef} className={`mb-1 h-2 w-full rounded ${isOver ? 'bg-primary/20' : 'bg-transparent'}`} />
  );
}

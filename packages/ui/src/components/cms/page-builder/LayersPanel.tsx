"use client";

import { DndContext, useSensor, useSensors, PointerSensor, KeyboardSensor, DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import type { EditorFlags } from "./state/layout/types";
import { isHiddenForViewport } from "./state/layout/utils";
import { applyDesktopOrderAcrossBreakpoints } from "./utils/applyDesktopOrder";
import { Cluster } from "../../atoms/primitives/Cluster";
import { LayerList } from "./LayersPanelList";
import { RootDropZone } from "./LayersPanelRootDropZone";
import { useSelectionHandlers } from "./useLayerSelectionHandlers";
import type { LayersPanelProps, LayerNode } from "./LayersPanel.types";
import { useTranslations } from "@acme/i18n";

export default function LayersPanel({ components, selectedIds, onSelectIds, dispatch, editor, viewport = "desktop", crossNotices = true }: LayersPanelProps) {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const searchInputId = "pb-layers-search";
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onSelect = useSelectionHandlers(selectedIds, onSelectIds);

  const visible = useMemo(() => {
    const decorate = (n: LayerNode): LayerNode => {
      const flags: EditorFlags | undefined = (editor ?? {})[n.id];
      const children = Array.isArray(n.children) ? (n.children as LayerNode[]).map(decorate) : undefined;
      const hiddenBase = (n as { hidden?: boolean }).hidden;
      const hidden = isHiddenForViewport(n.id, editor, hiddenBase, viewport);
      const name = flags?.name;
      const isGlobal = !!flags?.global?.id;
      const hasVpOverride = (() => {
        if (!crossNotices) return false;
        const suffix = viewport === 'mobile' ? 'Mobile' : viewport === 'tablet' ? 'Tablet' : 'Desktop';
        const keys = Object.keys((n as Record<string, unknown>) || {});
        return keys.some((k) => k.endsWith(suffix));
      })();
      return { ...n, ...(children ? { children } : {}), ...(name !== undefined ? { name } : {}), hidden, __isGlobal: isGlobal, __hasOverride: hasVpOverride } as LayerNode;
    };
    const baseNodes = (components as LayerNode[]).map(decorate);
    if (!search) return baseNodes;
    const query = search.toLowerCase();
    const filterTree = (nodes: LayerNode[]): LayerNode[] =>
      nodes
        .map((n) => {
          const name = String((n.name ?? n.type)).toLowerCase();
          const children = Array.isArray(n.children) ? filterTree(n.children as LayerNode[]) : undefined;
          const match = name.includes(query) || (children && children.length > 0);
          if (!match) return null as unknown as LayerNode;
          return { ...n, children } as LayerNode;
        })
        .filter(Boolean) as LayerNode[];
    return filterTree(baseNodes);
  }, [components, editor, viewport, search, crossNotices]);

  const handleDragEnd = (ev: DragEndEvent) => {
    const { active, over } = ev;
    if (!over) return;
    const a = active.data.current as { index: number; parentId?: string };
    const o = over.data.current as { index: number; parentId?: string };
    if (!a || !o) return;
    if (a.parentId === o.parentId) {
      let toIndex = o.index;
      if (a.index < o.index) toIndex = o.index - 1;
      dispatch({ type: "move", from: { parentId: a.parentId, index: a.index }, to: { parentId: o.parentId, index: toIndex } });
      return;
    }
    dispatch({ type: "move", from: { parentId: a.parentId, index: a.index }, to: { parentId: o.parentId, index: o.index } });
  };

  return (
    <div className="space-y-2">
      <Cluster gap={2} justify="between" alignY="center">
        <h3 className="text-sm font-semibold">{t("cms.builder.layers.title")}</h3>
        <button
          type="button"
          className="min-h-10 min-w-10 rounded border px-2 py-1 text-xs hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          title={t("cms.builder.applyDesktopOrder.title") as string}
          onClick={() => {
            try { applyDesktopOrderAcrossBreakpoints(components, editor, dispatch); } catch {}
          }}
        >
          {t("cms.builder.applyDesktopOrder.cta")}
        </button>
      </Cluster>
      <label htmlFor={searchInputId} className="sr-only">{t("cms.builder.searchLayers.label")}</label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("cms.builder.searchLayers.placeholder") as string}
        className="w-full rounded border p-1 text-sm"
        id={searchInputId}
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="rounded border border-dashed p-1">
          <RootDropZone topLevelCount={(visible as LayerNode[]).length} />
          <LayerList
            nodes={visible as LayerNode[]}
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

"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Inline } from "../../atoms/primitives/Inline";
import { Stack } from "../../atoms/primitives/Stack";

import type { LayerNode } from "./LayersPanel.types";
import { LayersPanelChildren } from "./LayersPanelChildren";
import { LayersPanelRow } from "./LayersPanelRow";

export function LayerList({ nodes, parentId, selectedIds, onSelect, onToggleHidden, onToggleLocked, onRename, collapsed, setCollapsed }: {
  nodes: LayerNode[];
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
                <LayersPanelRow
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
                <LayersPanelChildren parent={n} childCount={(n.children as LayerNode[]).length}>
                  <LayerList
                    nodes={(n.children as LayerNode[]) || []}
                    parentId={n.id}
                    selectedIds={selectedIds}
                    onSelect={onSelect}
                    onToggleHidden={onToggleHidden}
                    onToggleLocked={onToggleLocked}
                    onRename={onRename}
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                  />
                </LayersPanelChildren>
              )}
            </div>
          );
        })}
      </Stack>
    </SortableContext>
  );
}

export { LayerList as default };

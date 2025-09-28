"use client";

import { useDroppable } from "@dnd-kit/core";
import type { LayerNode } from "./LayersPanel.types";
import type { PropsWithChildren } from "react";

export function LayersPanelChildren({ parent, childCount, children }: PropsWithChildren<{ parent: LayerNode; childCount: number }>) {
  const { setNodeRef, isOver } = useDroppable({ id: `layer-container-${parent.id}`, data: { parentId: parent.id, index: childCount } });
  return (
    <div className="ms-4">
      <div ref={setNodeRef} className={`rounded border border-dashed px-2 py-1 ${isOver ? 'border-primary' : 'border-transparent'}`}>
        {children}
      </div>
    </div>
  );
}

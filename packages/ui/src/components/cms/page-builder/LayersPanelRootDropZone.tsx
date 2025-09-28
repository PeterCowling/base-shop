"use client";

import { useDroppable } from "@dnd-kit/core";

export function RootDropZone({ topLevelCount }: { topLevelCount: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: `layer-root`, data: { parentId: undefined, index: topLevelCount } });
  return (
    <div ref={setNodeRef} className={`mb-1 h-2 w-full rounded ${isOver ? 'bg-primary/20' : 'bg-transparent'}`} />
  );
}

export default RootDropZone;


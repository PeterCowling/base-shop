"use client";

import { useRef } from "react";

import useSortableBlock from "./useSortableBlock";

export default function useBlockDnD(
  id: string,
  index: number,
  parentId: string | undefined,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sortable = useSortableBlock(id, index, parentId);

  const setNodeRef = (node: HTMLDivElement | null) => {
    sortable.setNodeRef(node);
    containerRef.current = node;
  };

  return { ...sortable, setNodeRef, containerRef } as const;
}


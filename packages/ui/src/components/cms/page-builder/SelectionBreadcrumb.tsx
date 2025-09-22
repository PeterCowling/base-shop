"use client";

import React, { useMemo } from "react";
import type { PageComponent } from "@acme/types";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
}

function findPath(list: PageComponent[], targetId: string, stack: PageComponent[] = []): PageComponent[] | null {
  for (const c of list) {
    const next = [...stack, c];
    if ((c as any).id === targetId) return next;
    const kids = (c as any).children as PageComponent[] | undefined;
    if (Array.isArray(kids)) {
      const found = findPath(kids, targetId, next);
      if (found) return found;
    }
  }
  return null;
}

export default function SelectionBreadcrumb({ components, selectedIds, onSelectIds }: Props) {
  const path = useMemo(() => {
    const id = selectedIds[0];
    if (!id) return [] as PageComponent[];
    return findPath(components, id) ?? [];
  }, [components, selectedIds]);

  if (!path.length) return null;

  return (
    <div className="absolute left-2 top-2 z-40 flex flex-wrap items-center gap-1 rounded bg-muted/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
      {path.map((node, idx) => (
        <React.Fragment key={(node as any).id}>
          <button
            type="button"
            className={`rounded border px-1 ${idx === path.length - 1 ? "bg-primary text-primary-foreground border-primary" : "bg-surface-1"}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelectIds([(node as any).id as string]);
              try {
                const el = document.querySelector(`[data-component-id="${(node as any).id}"]`) as HTMLElement | null;
                el?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
              } catch {}
            }}
          >
            {((node as any).name as string) || ((node as any).type as string)}
          </button>
          {idx < path.length - 1 && <span aria-hidden>›</span>}
        </React.Fragment>
      ))}
    </div>
  );
}


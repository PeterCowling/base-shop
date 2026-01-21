"use client";

import React, { useMemo } from "react";

import { useTranslations } from "@acme/i18n";
import type { PageComponent } from "@acme/types";

import { Inline } from "../../atoms/primitives";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
}

function findPath(
  list: PageComponent[],
  targetId: string,
  stack: PageComponent[] = []
): PageComponent[] | null {
  for (const c of list) {
    const next = [...stack, c];
    if (c.id === targetId) return next;
    const kids = (c as { children?: PageComponent[] }).children;
    if (Array.isArray(kids)) {
      const found = findPath(kids, targetId, next);
      if (found) return found;
    }
  }
  return null;
}

export default function SelectionBreadcrumb({ components, selectedIds, onSelectIds }: Props) {
  const t = useTranslations();
  const path = useMemo(() => {
    const id = selectedIds[0];
    if (!id) return [] as PageComponent[];
    return findPath(components, id) ?? [];
  }, [components, selectedIds]);

  if (!path.length) return null;

  return (
    <div className="relative">
      <div className="absolute start-2 bottom-2 rounded bg-muted/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
        <Inline gap={1} wrap>
          {path.map((node, idx) => {
            const label = (node as { name?: string }).name || node.type;
            // i18n-exempt -- TECH-000 class tokens [ttl=2099-12-31]
            const btnClass = `rounded border px-1 ${idx === path.length - 1 ? "bg-primary text-primary-foreground border-primary" : "bg-surface-1"}`;
            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  className={btnClass}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIds([node.id]);
                    try {
                      const el = document.querySelector(`[data-component-id="${node.id}"]`) as HTMLElement | null;
                      el?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
                    } catch {}
                  }}
                >
                  {label}
                </button>
                {idx < path.length - 1 && <span aria-hidden>{t("breadcrumb.separator")}</span>}
              </React.Fragment>
            );
          })}
        </Inline>
      </div>
    </div>
  );
}

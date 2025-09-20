"use client";

import type { ReactNode } from "react";
import { ItemProvider, useDataset } from "../data/DataContext";

export interface RepeaterProps {
  children?: ReactNode;
  /** Max items to render */
  limit?: number;
  /** Simple client-side filter using a property equals value, e.g. "status=published" */
  filter?: string;
  /** Property to sort by */
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  /** Grid layout options (optional) */
  columns?: number;
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
  /** Builder-only viewport hint for responsive values */
  pbViewport?: "desktop" | "tablet" | "mobile";
  className?: string;
}

export default function Repeater({
  children,
  limit,
  filter,
  sortBy,
  sortOrder = "asc",
  columns,
  columnsDesktop,
  columnsTablet,
  columnsMobile,
  gap,
  gapDesktop,
  gapTablet,
  gapMobile,
  pbViewport,
  className,
}: RepeaterProps) {
  const base = useDataset<any>();
  const filtered = (() => {
    if (!filter) return base;
    const m = /^(?<k>[^=!:><\s]+)\s*(?<op>==|=|!=|>=|<=|>|<)?\s*(?<v>.+)$/.exec(filter);
    if (!m || !m.groups) return base;
    const key = m.groups.k;
    const op = (m.groups.op ?? "=") as string;
    const val = m.groups.v;
    const coerce = (input: unknown): unknown => {
      const s = String(input ?? "");
      if (/^\d+(?:\.\d+)?$/.test(s)) return Number(s);
      if (s === "true" || s === "false") return s === "true";
      return s;
    };
    return base.filter((it: any) => {
      const a = coerce(it?.[key]);
      const b = coerce(val);
      switch (op) {
        case "=":
        case "==":
          return a === b;
        case "!=":
          return a !== b;
        case ">":
          return (a as number) > (b as number);
        case ">=":
          return (a as number) >= (b as number);
        case "<":
          return (a as number) < (b as number);
        case "<=":
          return (a as number) <= (b as number);
        default:
          return true;
      }
    });
  })();
  const sorted = (() => {
    if (!sortBy) return filtered;
    return [...filtered].sort((a: any, b: any) => {
      const av = a?.[sortBy];
      const bv = b?.[sortBy];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return sortOrder === "asc" ? av - bv : bv - av;
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as === bs) return 0;
      return sortOrder === "asc" ? (as < bs ? -1 : 1) : (as > bs ? -1 : 1);
    });
  })();
  const list = typeof limit === "number" ? sorted.slice(0, Math.max(0, limit)) : sorted;

  const effColumns = (() => {
    if (pbViewport === "desktop" && typeof columnsDesktop === "number") return columnsDesktop;
    if (pbViewport === "tablet" && typeof columnsTablet === "number") return columnsTablet;
    if (pbViewport === "mobile" && typeof columnsMobile === "number") return columnsMobile;
    return typeof columns === "number" ? columns : 1;
  })();
  const effGap = (() => {
    if (pbViewport === "desktop" && gapDesktop) return gapDesktop;
    if (pbViewport === "tablet" && gapTablet) return gapTablet;
    if (pbViewport === "mobile" && gapMobile) return gapMobile;
    return gap ?? "1rem";
  })();

  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${effColumns}, minmax(0, 1fr))`,
        gap: effGap,
      }}
    >
      {list.map((it, idx) => (
        <ItemProvider key={(it as any)?.id ?? idx} item={it} index={idx}>
          {children}
        </ItemProvider>
      ))}
    </div>
  );
}


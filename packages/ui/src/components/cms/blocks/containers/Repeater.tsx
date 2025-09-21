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
  const base = useDataset<unknown>();
  const filtered = (() => {
    if (!filter) return base;
    // Safe, non-regex parsing: find the first operator token
    const ops = ["==", "!=", ">=", "<=", ">", "<", "="] as const;
    let key = filter;
    let op: (typeof ops)[number] = "=";
    let val = "";
    for (const candidate of ops) {
      const idx = filter.indexOf(candidate);
      if (idx > 0) {
        key = filter.slice(0, idx).trim();
        op = candidate;
        val = filter.slice(idx + candidate.length).trim();
        break;
      }
    }
    if (!val && key !== filter) {
      val = filter.slice(filter.indexOf(op) + op.length).trim();
    }
    if (!key) return base;
    const coerce = (input: unknown): unknown => {
      const s = String(input ?? "");
      const n = Number(s);
      if (s !== '' && Number.isFinite(n)) return n;
      if (s === "true" || s === "false") return s === "true";
      return s;
    };
    const getKey = (it: unknown, k: string): unknown => (it && typeof it === 'object') ? (it as Record<string, unknown>)[k] : undefined;
    return base.filter((it: unknown) => {
      const a = coerce(getKey(it, key));
      const b = coerce(val);
      switch (op) {
        case "=":
        case "==":
          return a === b;
        case "!=":
          return a !== b;
        case ">":
          return Number(a) > Number(b);
        case ">=":
          return Number(a) >= Number(b);
        case "<":
          return Number(a) < Number(b);
        case "<=":
          return Number(a) <= Number(b);
        default:
          return true;
      }
    });
  })();
  const sorted = (() => {
    if (!sortBy) return filtered;
    return [...filtered].sort((a: unknown, b: unknown) => {
      const av = (a && typeof a === 'object') ? (a as Record<string, unknown>)[sortBy] : undefined;
      const bv = (b && typeof b === 'object') ? (b as Record<string, unknown>)[sortBy] : undefined;
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
        <ItemProvider key={(it && typeof it === 'object' && (it as Record<string, unknown>).id != null ? String((it as Record<string, unknown>).id) : String(idx))} item={it} index={idx}>
          {children}
        </ItemProvider>
      ))}
    </div>
  );
}

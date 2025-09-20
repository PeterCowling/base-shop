"use client";

import React from "react";
import { useCurrentItem, useDatasetMeta } from "../data/DataContext";

export interface BindProps {
  /** Name of the prop to inject onto the only child */
  prop?: string;
  /** Dot path into current item, e.g. "title" or "image.url" */
  path?: string;
  /** Fallback value when path resolves to undefined */
  fallback?: unknown;
  children?: React.ReactNode;
}

function getByPath(obj: unknown, path?: string): unknown {
  if (!obj || !path) return undefined;
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
  let cur: any = obj as any;
  for (const part of parts) {
    cur = cur?.[part];
    if (cur == null) break;
  }
  return cur ?? undefined;
}

function template(str: string, item: any): string {
  return str.replace(/\{([^}]+)\}/g, (_, key) => {
    const val = getByPath(item, key);
    return val == null ? "" : String(val);
  });
}

/**
 * Bind wrapper: clones its only child, injecting a prop from the current item context.
 */
export default function Bind({ prop = "text", path, fallback, children }: BindProps) {
  const { item } = useCurrentItem<any>();
  const meta = useDatasetMeta();
  // Resolve value either as dot-path or as template with {field}
  let value: unknown = undefined;
  if (typeof path === "string" && path.includes("{")) {
    value = typeof item === "object" ? template(path, item) : String(item ?? "");
  } else {
    value = getByPath(item, path);
  }
  // Special case: build href from dataset itemRoutePattern if prop is href and pattern present
  if (prop === "href" && !path && meta?.itemRoutePattern && item) {
    value = template(meta.itemRoutePattern, item);
  }
  const inject = value === undefined || value === "" ? fallback : value;
  const arr = React.Children.toArray(children) as React.ReactElement[];
  const first = arr[0] as React.ReactElement | undefined;
  if (!first) return null;
  try {
    return React.cloneElement(first, { [prop]: inject } as Record<string, unknown>);
  } catch {
    return first;
  }
}

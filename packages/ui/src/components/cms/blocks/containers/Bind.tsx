"use client";

import React from "react";
import { useCurrentItem, useDatasetMeta } from "../data/DataContext";
import type { TranslatableText } from "@acme/types/i18n";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations } from "@acme/i18n";
import { resolveText } from "@i18n/resolveText";

export interface BindProps {
  /** Name of the prop to inject onto the only child */
  prop?: string;
  /** Dot path into current item, e.g. "title" or "image.url" */
  path?: string;
  /** Fallback value when path resolves to undefined */
  fallback?: unknown;
  /** If true, bypass i18n resolution and pass raw value */
  raw?: boolean;
  /** Current locale for resolving TranslatableText values */
  locale?: Locale;
  children?: React.ReactNode;
}

function getByPath(obj: unknown, path?: string): unknown {
  if (!obj || !path) return undefined;
  const parts = path.split(".").map((p) => p.trim()).filter(Boolean);
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      cur = undefined;
      break;
    }
  }
  return cur ?? undefined;
}

function template(str: string, item: unknown): string {
  return str.replace(/\{([^}]+)\}/g, (_, key) => {
    const val = getByPath(item, key);
    return val == null ? "" : String(val);
  });
}

/**
 * Bind wrapper: clones its only child, injecting a prop from the current item context.
 */
export default function Bind({ prop = "text", path, fallback, raw = false, locale = "en", children }: BindProps) {
  const { item } = useCurrentItem<unknown>();
  const meta = useDatasetMeta();
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
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
  if (path && (value === undefined || value === null)) {
    console.warn(`[Bind] Missing value for path "${path}" on item`, item);
  }
  let inject = value === undefined || value === "" ? fallback : value;
  // Lazy-resolve translatable values unless raw requested
  if (!raw && inject != null && typeof inject === "object") {
    const v = inject as Partial<Record<string, unknown>> & { type?: unknown };
    if (typeof v.type === "string" && (v.type === "key" || v.type === "inline")) {
      try {
        inject = resolveText(inject as TranslatableText, locale, t);
      } catch {
        // leave as-is on resolver errors
      }
    }
  }
  const arr = React.Children.toArray(children) as React.ReactElement[];
  const first = arr[0] as React.ReactElement | undefined;
  if (!first) return null;
  try {
    const nextProps: Record<string, unknown> = { [prop]: inject };
    const prev = (first.props as Record<string, unknown>)[prop];
    if (inject != null && prev != null && typeof prev !== typeof inject) {
      console.warn(`[Bind] Type mismatch for prop "${prop}": expected ${typeof prev}, got ${typeof inject}`);
    }
    return React.cloneElement(first, nextProps);
  } catch {
    return first;
  }
}

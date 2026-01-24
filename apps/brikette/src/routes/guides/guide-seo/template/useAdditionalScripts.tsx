import { isValidElement, useRef } from "react";

import { IS_DEV } from "@/config/env";

import type { GuideSeoTemplateContext } from "../types";

// Cache additional head scripts by guide + lang to avoid duplicate
// invocations across incidental remounts (e.g., StrictMode) in tests.
const additionalScriptsCache: Map<string, React.ReactNode | null> = new Map();

export function useAdditionalScripts(params: {
  additionalScripts?: (context: GuideSeoTemplateContext) => React.ReactNode;
  context: GuideSeoTemplateContext;
  guideKey: string;
  lang: string;
}): React.ReactNode | null {
  const { additionalScripts, context, guideKey, lang } = params;
  const additionalScriptsNodeRef = useRef<React.ReactNode | null>(null);

  if (additionalScriptsNodeRef.current === null) {
    // Include article title in the cache key so tests that mutate dictionaries
    // across renders don't receive stale additional scripts from a previous
    // invocation with different localized content.
    const cacheKey = `${String(guideKey)}::${String(lang)}::${String((context as any)?.article?.title ?? "").trim()}`;
    // If we have a cached node for this (guide, lang, title) snapshot, reuse
    // it to avoid re-invoking function components (e.g., CheapEatsMeta) on
    // incidental re-mounts or state-driven re-renders in tests.
    if (additionalScriptsCache.has(cacheKey)) {
      additionalScriptsNodeRef.current = additionalScriptsCache.get(cacheKey) ?? null;
    } else {
      // Invoke the builder once and, when the top-level result is a function
      // component, resolve it to its host element tree immediately. This
      // avoids React invoking the top-level component again on incidental
      // re-mounts (e.g., StrictMode), which several tests assert should not
      // happen for additional head scripts like CheapEatsMeta.
      const built = additionalScripts ? additionalScripts(context) : null;
      const resolveTopLevel = (node: React.ReactNode): React.ReactNode => {
        try {
          if (isValidElement(node) && typeof (node as any).type === "function") {
            const Comp = (node as any).type as (p: unknown) => React.ReactNode;
            return Comp((node as any).props);
          }
        } catch (err) {
          if (IS_DEV) console.debug("[GuideSeoTemplate] component render", err);
        }
        return node;
      };
      const resolved = resolveTopLevel(built);
      additionalScriptsNodeRef.current = resolved;
      additionalScriptsCache.set(cacheKey, resolved);
    }
  }

  return additionalScriptsNodeRef.current;
}

export function resetAdditionalScriptsCache(): void {
  additionalScriptsCache.clear();
}

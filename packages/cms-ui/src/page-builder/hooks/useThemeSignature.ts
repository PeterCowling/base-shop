// packages/ui/src/components/cms/page-builder/hooks/useThemeSignature.ts
"use client";

import { useEffect, useMemo, useState } from "react";

function readToken(key: string): string {
  try {
    const root = document.documentElement;
    const v = getComputedStyle(root).getPropertyValue(key).trim();
    return v || "";
  } catch {
    return "";
  }
}

function currentSignature(keys: string[]): string {
  if (typeof window === "undefined") return "ssr";
  const parts = keys.map((k) => `${k}:${readToken(k)}`);
  const isDark = document.documentElement.classList.contains("theme-dark") ||
    (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); // i18n-exempt -- PB-234: media query string
  parts.push(`dark:${isDark ? 1 : 0}`);
  return parts.join("|");
}

/**
 * Returns a string that changes whenever theme-related signals change.
 * Useful to re-compute derived previews on theme toggles or token edits.
 */
// i18n-exempt -- PB-234: Technical token keys, not user-facing copy
export default function useThemeSignature(tokenKeys: string[] = ["--color-bg", "--color-fg"]): string {
  const [sig, setSig] = useState<string>(() => (typeof window === "undefined" ? "ssr" : currentSignature(tokenKeys)));
  // Normalise keys so the effect can depend on a stable signature
  const keysSig = useMemo(() => tokenKeys.join("|"), [tokenKeys]);
  const keysList = useMemo(() => tokenKeys.slice(), [tokenKeys]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSig(currentSignature(keysList)));
    };

    // Observe root class changes (theme-dark) and attribute changes
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] }); // i18n-exempt -- PB-234: attribute names

    // React to OS scheme changes
    const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)"); // i18n-exempt -- PB-234: media query string
    const onMql = () => update();
    mql?.addEventListener?.("change", onMql);

    // Listen for cross-tab theme changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme") update(); // i18n-exempt -- PB-234: storage key
    };
    window.addEventListener("storage", onStorage);

    // Custom events: theme changed and tokens changed
    const onTheme = () => update();
    window.addEventListener("pb:theme-changed", onTheme as EventListener); // i18n-exempt -- PB-234: custom event name

    const onTokens = (e: Event) => {
      try {
        const det = (e as CustomEvent<{ keys?: string[] }>).detail;
        if (!det?.keys || det.keys.some((k) => keysList.includes(k))) {
          update();
        }
      } catch {
        update();
      }
    };
    window.addEventListener("pb:tokens-changed", onTokens as EventListener); // i18n-exempt -- PB-234: custom event name

    // Initial sync
    update();

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      mql?.removeEventListener?.("change", onMql);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pb:theme-changed", onTheme as EventListener);
      window.removeEventListener("pb:tokens-changed", onTokens as EventListener);
    };
    // keysSig captures changes to `tokenKeys` in a stable string signature
  }, [keysSig, keysList]);

  // Memoize to ensure stable identity across renders when unchanged
  return useMemo(() => sig, [sig]);
}

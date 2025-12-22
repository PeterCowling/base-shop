// src/utils/debug.ts
import { DEBUG_GUIDE_TITLES, DEBUG_GUIDES } from "@/config/env";

export function isGuideDebugEnabled(): boolean {
  try {
    // Env flag
    const v = String(DEBUG_GUIDE_TITLES ?? DEBUG_GUIDES ?? "").toLowerCase();
    if (v === "1" || v === "true" || v === "yes") return true;

    // URL flag (?debug=1 or ?debug=guides)
    if (typeof window !== "undefined" && window.location && window.location.search) {
      const q = new URLSearchParams(window.location.search);
      const d = (q.get("debug") || "").toLowerCase();
      if (d === "1" || d === "true" || d === "yes" || d === "guides" || d === "guide") return true;
    }

    // localStorage flag (persist across refresh)
    if (typeof window !== "undefined" && window.localStorage) {
      const ls = (window.localStorage.getItem("debug:guides") || "").toLowerCase();
      if (ls === "1" || ls === "true" || ls === "yes") return true;
    }
  } catch {
    // ignore
  }
  return false;
}

export function debugGuide(...args: unknown[]): void {
  if (!isGuideDebugEnabled()) return;
  console.info("[GuideDebug]", ...args);
}

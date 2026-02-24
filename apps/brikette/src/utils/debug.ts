// src/utils/debug.ts
import { DEBUG_GUIDE_TITLES, DEBUG_GUIDES } from "@/config/env";

const TRUTHY_DEBUG_VALUES = new Set(["1", "true", "yes"]);
const URL_DEBUG_VALUES = new Set(["1", "true", "yes", "guides", "guide"]);

function normalizeDebugFlag(value: string | null | undefined): string {
  return String(value ?? "").toLowerCase();
}

function isTruthyDebugFlag(value: string | null | undefined): boolean {
  return TRUTHY_DEBUG_VALUES.has(normalizeDebugFlag(value));
}

function isUrlDebugFlag(value: string | null | undefined): boolean {
  return URL_DEBUG_VALUES.has(normalizeDebugFlag(value));
}

function readUrlDebugFlag(): boolean {
  if (typeof window === "undefined" || !window.location?.search) return false;
  const params = new URLSearchParams(window.location.search);
  return isUrlDebugFlag(params.get("debug"));
}

function readStorageDebugFlag(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  return isTruthyDebugFlag(window.localStorage.getItem("debug:guides"));
}

export function isGuideDebugEnabled(): boolean {
  try {
    if (isTruthyDebugFlag(DEBUG_GUIDE_TITLES ?? DEBUG_GUIDES)) return true;
    if (readUrlDebugFlag()) return true;
    if (readStorageDebugFlag()) return true;
  } catch {
    // ignore
  }
  return false;
}

export function debugGuide(...args: unknown[]): void {
  if (!isGuideDebugEnabled()) return;
  console.info("[GuideDebug]", ...args);
}

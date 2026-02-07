// src/utils/guideStatus.ts
import * as GuidesIndex from "@/data/guides.index";

export type GuideStatus = "draft" | "review" | "published";

const STORAGE_KEY = "guideStatusOverrides";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readOverrides(): Record<string, GuideStatus> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, GuideStatus> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (v === "draft" || v === "review" || v === "published") {
        out[k] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeOverrides(data: Record<string, GuideStatus>): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage failures in dev
  }
}

/**
 * Get the base guide status from manifest, ignoring localStorage overrides.
 * Use this for SSR-safe initial render to avoid hydration mismatches.
 */
export function getManifestGuideStatus(key: string): GuideStatus {
  const statusMap = ((GuidesIndex as unknown as Record<string, unknown>)?.["GUIDE_STATUS_BY_KEY"] || {}) as Record<string, GuideStatus>;
  return (statusMap[key] ?? "published") as GuideStatus;
}

/**
 * Get effective guide status including localStorage overrides.
 * Note: This returns different values on SSR vs client when overrides exist.
 * For hydration-safe initial render, use getManifestGuideStatus() instead.
 */
export function getEffectiveGuideStatus(key: string): GuideStatus {
  const overrides = readOverrides();
  const override = overrides[key];
  if (override) return override;
  return getManifestGuideStatus(key);
}

export function setGuideStatus(key: string, status: GuideStatus): void {
  const overrides = readOverrides();
  overrides[key] = status;
  writeOverrides(overrides);
}

export function toggleGuideStatus(key: string): GuideStatus {
  const current = getEffectiveGuideStatus(key);
  const next: GuideStatus = current === "published" ? "draft" : "published";
  setGuideStatus(key, next);
  return next;
}

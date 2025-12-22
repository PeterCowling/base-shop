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

export function getEffectiveGuideStatus(key: string): GuideStatus {
  const overrides = readOverrides();
  const override = overrides[key];
  if (override) return override;
  const statusMap = ((GuidesIndex as unknown as Record<string, unknown>)?.["GUIDE_STATUS_BY_KEY"] || {}) as Record<string, GuideStatus>;
  return (statusMap[key] ?? "published") as GuideStatus;
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

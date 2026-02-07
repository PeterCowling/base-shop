// packages/ui/src/components/cms/page-builder/libraryStore.ts
"use client";

import type { PageComponent } from "@acme/types";

export type LibraryItem = {
  id: string;
  label: string;
  createdAt: number;
  // Single or multi-node templates
  template?: PageComponent;
  templates?: PageComponent[];
  // Optional metadata
  tags?: string[];
  thumbnail?: string | null;
  // Sharing metadata (best-effort; enforced server-side in CMS API)
  ownerUserId?: string;
  shared?: boolean;
};

const keyFor = (shop: string | null | undefined) => `pb-library-${shop || "default"}`;
const keyForGlobals = (shop: string | null | undefined) => `pb-globals-${shop || "default"}`;
const keyForPageGlobals = (shop: string | null | undefined, pageId: string | null | undefined) => `pb-globals-${shop || "default"}-page-${pageId || "default"}`;

function emitChange() {
  if (typeof window === "undefined") return;
  try {
    const ev = new CustomEvent("pb-library-changed");
    window.dispatchEvent(ev);
  } catch {
    // noop
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const val = JSON.parse(raw) as T;
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

// Local snapshot helpers (used for fast UI and in-page snapshotting)
export function listLibrary(shop?: string | null): LibraryItem[] {
  if (typeof window === "undefined") return [];
  const arr = safeParse<LibraryItem[]>(localStorage.getItem(keyFor(shop)), []);
  return Array.isArray(arr) ? arr : [];
}

function writeLocal(shop: string | null | undefined, items: LibraryItem[]) {
  try {
    localStorage.setItem(keyFor(shop), JSON.stringify(items));
  } catch {}
}

// Network-backed helpers. We keep the local snapshot in sync opportunistically.
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = isJson ? await res.json() : undefined;
    } catch {}
    const message =
      detail && typeof detail === "object" && "error" in detail
        ? String((detail as { error?: unknown }).error ?? `Request failed: ${res.status}`)
        : `Request failed: ${res.status}`;
    const err = new Error(message) as Error & { data?: unknown };
    if (detail) err.data = detail;
    throw err;
  }
  return (isJson ? await res.json() : (undefined as unknown)) as T;
}

export async function syncFromServer(shop: string | null | undefined): Promise<LibraryItem[] | null> {
  if (!shop) return null;
  try {
    const data = await fetchJson<LibraryItem[]>(`/api/library?shop=${encodeURIComponent(shop)}`);
    if (Array.isArray(data)) {
      writeLocal(shop, data);
      emitChange();
      return data;
    }
  } catch {
    // ignore network issues; stay with local snapshot
  }
  return null;
}

export async function saveLibrary(shop: string | null | undefined, item: LibraryItem) {
  // Optimistic local update
  const current = listLibrary(shop);
  const next = [item, ...current.filter((i) => i.id !== item.id)];
  writeLocal(shop, next);
  emitChange();
  // Attempt server persistence
  try {
    if (shop) {
      await fetchJson(`/api/library?shop=${encodeURIComponent(shop)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      // Pull canonical server list
      await syncFromServer(shop);
    }
  } catch {
    // keep local only if server fails
  }
}

// Strict save: if server rejects (e.g., validation), roll back and throw
export async function saveLibraryStrict(shop: string | null | undefined, item: LibraryItem) {
  const current = listLibrary(shop);
  const next = [item, ...current.filter((i) => i.id !== item.id)];
  writeLocal(shop, next);
  emitChange();
  try {
    if (shop) {
      await fetchJson(`/api/library?shop=${encodeURIComponent(shop)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      await syncFromServer(shop);
    }
  } catch (err) {
    // rollback
    writeLocal(shop || null, current);
    emitChange();
    throw err;
  }
}

export async function updateLibrary(
  shop: string | null | undefined,
  id: string,
  patch: Partial<Pick<LibraryItem, "label" | "tags" | "thumbnail" | "shared">>,
): Promise<void> {
  try {
    if (shop) {
      await fetchJson(`/api/library?shop=${encodeURIComponent(shop)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch }),
      });
      await syncFromServer(shop);
      return;
    }
  } catch {}
  // Fallback to local
  const current = listLibrary(shop);
  const next = current.map((i) => (i.id === id ? { ...i, ...patch } : i));
  writeLocal(shop, next);
  emitChange();
}

export async function removeLibrary(shop: string | null | undefined, id: string) {
  // Optimistic local update
  const current = listLibrary(shop);
  writeLocal(shop, current.filter((i) => i.id !== id));
  emitChange();
  try {
    if (shop) {
      await fetchJson(`/api/library?shop=${encodeURIComponent(shop)}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await syncFromServer(shop);
    }
  } catch {
    // ignore
  }
}

export async function clearLibrary(shop: string | null | undefined) {
  writeLocal(shop, []);
  emitChange();
  try {
    if (shop) {
      await fetchJson(`/api/library?shop=${encodeURIComponent(shop)}&all=1`, { method: "DELETE" });
      await syncFromServer(shop);
    }
  } catch {
    // ignore
  }
}

// ===== Global components (linked templates) =====
export type GlobalItem = {
  globalId: string; // stable id used by instances
  label: string;
  createdAt: number;
  template: PageComponent; // single node template
  tags?: string[];
  thumbnail?: string | null;
  // Optional: independent breakpoints for this global
  breakpoints?: { id: string; label: string; min?: number; max?: number }[];
};

export function listGlobals(shop?: string | null): GlobalItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<GlobalItem[]>(localStorage.getItem(keyForGlobals(shop)), []);
}

function writeGlobals(shop: string | null | undefined, items: GlobalItem[]) {
  try {
    localStorage.setItem(keyForGlobals(shop), JSON.stringify(items));
  } catch {}
}

export async function saveGlobal(shop: string | null | undefined, item: GlobalItem) {
  const cur = listGlobals(shop);
  const next = [item, ...cur.filter((g) => g.globalId !== item.globalId)];
  writeGlobals(shop, next);
  emitChange();
  try {
    if (shop) {
      await fetchJson(`/api/globals?shop=${encodeURIComponent(shop)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
      // Optionally pull server copy
      try {
        const remote = await fetchJson<GlobalItem[]>(`/api/globals?shop=${encodeURIComponent(shop)}`);
        if (Array.isArray(remote)) writeGlobals(shop, remote);
      } catch {}
    }
  } catch {
    // ignore; local only
  }
}

export async function updateGlobal(shop: string | null | undefined, globalId: string, patch: Partial<Pick<GlobalItem, "label" | "template" | "tags" | "thumbnail" | "breakpoints">>) {
  // local
  const cur = listGlobals(shop);
  const next = cur.map((g) => (g.globalId === globalId ? { ...g, ...patch } : g));
  writeGlobals(shop, next);
  emitChange();
  // server (best-effort)
  try {
    if (shop) {
      await fetchJson(`/api/globals?shop=${encodeURIComponent(shop)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalId, patch }),
      });
    }
  } catch {}
}

export async function removeGlobal(shop: string | null | undefined, globalId: string) {
  writeGlobals(shop, listGlobals(shop).filter((g) => g.globalId !== globalId));
  emitChange();
  try {
    if (shop) {
      await fetchJson(`/api/globals?shop=${encodeURIComponent(shop)}&id=${encodeURIComponent(globalId)}`, { method: "DELETE" });
    }
  } catch {}
}

// === Page-scoped Globals: used when global sections should be page-level ===
export function listGlobalsForPage(shop?: string | null, pageId?: string | null): GlobalItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<GlobalItem[]>(localStorage.getItem(keyForPageGlobals(shop, pageId)), []);
}

function writePageGlobals(shop: string | null | undefined, pageId: string | null | undefined, items: GlobalItem[]) {
  try { localStorage.setItem(keyForPageGlobals(shop, pageId), JSON.stringify(items)); } catch {}
}

export async function saveGlobalForPage(shop: string | null | undefined, pageId: string | null | undefined, item: GlobalItem) {
  const cur = listGlobalsForPage(shop, pageId);
  const next = [item, ...cur.filter((g) => g.globalId !== item.globalId)];
  writePageGlobals(shop, pageId, next);
  emitChange();
  // best-effort server persistence (ignore if unsupported)
  try {
    if (shop) {
      await fetchJson(`/api/globals?shop=${encodeURIComponent(shop)}&pageId=${encodeURIComponent(pageId || "")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item }),
      });
    }
  } catch {}
}

export async function updateGlobalForPage(shop: string | null | undefined, pageId: string | null | undefined, globalId: string, patch: Partial<Pick<GlobalItem, "label" | "template" | "tags" | "thumbnail" | "breakpoints">>) {
  const cur = listGlobalsForPage(shop, pageId);
  const next = cur.map((g) => (g.globalId === globalId ? { ...g, ...patch } : g));
  writePageGlobals(shop, pageId, next);
  emitChange();
  try {
    if (shop) {
      await fetchJson(`/api/globals?shop=${encodeURIComponent(shop)}&pageId=${encodeURIComponent(pageId || "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ globalId, patch }),
      });
    }
  } catch {}
}

export async function removeGlobalForPage(shop: string | null | undefined, pageId: string | null | undefined, globalId: string) {
  writePageGlobals(shop, pageId, listGlobalsForPage(shop, pageId).filter((g) => g.globalId !== globalId));
  emitChange();
  try {
    if (shop) {
      await fetchJson(`/api/globals?shop=${encodeURIComponent(shop)}&pageId=${encodeURIComponent(pageId || "")}&id=${encodeURIComponent(globalId)}`, { method: "DELETE" });
    }
  } catch {}
}

// packages/ui/src/components/cms/page-builder/libraryStore.ts
"use client";

import type { PageComponent } from "@acme/types";

export type LibraryItem = {
  id: string;
  label: string;
  template: PageComponent; // root component (may have children)
  createdAt: number;
};

const keyFor = (shop: string | null | undefined) => `pb-library-${shop || "default"}`;

function emitChange() {
  if (typeof window === "undefined") return;
  try {
    const ev = new CustomEvent("pb-library-changed");
    window.dispatchEvent(ev);
  } catch {
    // noop
  }
}

export function listLibrary(shop?: string | null): LibraryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(shop));
    if (!raw) return [];
    const arr = JSON.parse(raw) as LibraryItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveLibrary(shop: string | null | undefined, item: LibraryItem) {
  if (typeof window === "undefined") return;
  const current = listLibrary(shop);
  const next = [item, ...current.filter((i) => i.id !== item.id)];
  localStorage.setItem(keyFor(shop), JSON.stringify(next));
  emitChange();
}

export function removeLibrary(shop: string | null | undefined, id: string) {
  if (typeof window === "undefined") return;
  const current = listLibrary(shop);
  localStorage.setItem(
    keyFor(shop),
    JSON.stringify(current.filter((i) => i.id !== id))
  );
  emitChange();
}

export function clearLibrary(shop: string | null | undefined) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(keyFor(shop));
  emitChange();
}

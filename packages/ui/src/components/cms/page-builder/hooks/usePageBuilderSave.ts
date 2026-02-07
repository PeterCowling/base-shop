"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { HistoryState,Page, PageComponent } from "@acme/types";

import type { GlobalItem } from "../libraryStore";
import { exportComponents } from "../state/exportComponents";

import useAutoSave from "./useAutoSave";
import useLocalStrings from "./useLocalStrings";

interface Params {
  page: Page;
  components: PageComponent[];
  state: HistoryState;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  formDataDeps: unknown[];
  onAutoSaveError?: (retry: () => void) => void;
  clearHistory: () => void;
  /** Optional shop id to embed local library snapshots */
  shop?: string | null;
}

export default function usePageBuilderSave({
  page,
  components,
  state,
  onSave,
  onPublish,
  formDataDeps,
  onAutoSaveError,
  clearHistory,
  shop,
}: Params) {
  const t = useLocalStrings();
  // Track the latest updatedAt returned by the server to avoid optimistic
  // concurrency conflicts on subsequent auto-saves.
  const [updatedAt, setUpdatedAt] = useState(page.updatedAt);
  // Lazy import to avoid SSR issues
  const getLibrary = useCallback(() => {
    try {
      const req = (eval("require") as (id: string) => unknown);
      const mod = req("../libraryStore") as typeof import("../libraryStore");
      return mod.listLibrary(shop);
    } catch {
      return [];
    }
  }, [shop]);
  const getGlobals = useCallback(() => {
    try {
      const req = (eval("require") as (id: string) => unknown);
      const mod = req("../libraryStore") as typeof import("../libraryStore");
      return mod.listGlobals(shop) as GlobalItem[];
    } catch {
      return [] as GlobalItem[];
    }
  }, [shop]);
  const formData = useMemo(() => {
    const fd = new FormData();
    fd.append("id", page.id);
    fd.append("updatedAt", updatedAt);
    fd.append("slug", page.slug);
    fd.append("status", page.status);
    if ((page as { stableId?: string }).stableId) {
      fd.append("stableId", String((page as { stableId?: string }).stableId));
    }
    fd.append("title", JSON.stringify(page.seo.title));
    fd.append("description", JSON.stringify(page.seo.description ?? {}));
    fd.append("components", JSON.stringify(components));
    fd.append("history", JSON.stringify(state));
    // Optional library snapshot
    try {
      const lib = getLibrary();
      if (lib && Array.isArray(lib) && lib.length > 0) {
        fd.append("library", JSON.stringify(lib));
      }
    } catch {
      // ignore library persistence errors
    }
    return fd;
  }, [page, components, state, updatedAt, getLibrary]);

  const formDataRef = useRef<FormData>(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Wrap onSave to capture the server's latest updatedAt and keep our
  // subsequent saves in sync.
  const saveWithMetaUpdate = useCallback(
    async (fd: FormData) => {
      const res: unknown = await onSave(fd).catch((err) => {
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'error', title: t('notify_save_failed'), message: String((err as { message?: unknown })?.message || err) } })); } catch {}
        throw err;
      });
      try {
        const next = (res as { page?: { updatedAt?: string }; updatedAt?: string })?.page ??
          (res as { updatedAt?: string } | undefined);
        if (next && typeof next.updatedAt === "string" && next.updatedAt) {
          setUpdatedAt(next.updatedAt);
        }
      } catch {
        /* ignore shape mismatches */
      }
      try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'save', title: t('notify_changes_saved') } })); } catch {}
      return res;
    },
    [onSave, t]
  );

  const handleSave = useCallback(() => saveWithMetaUpdate(formDataRef.current), [saveWithMetaUpdate]);
  const handlePublish = useCallback(() => {
    // Build a transformed FormData merging editor metadata into components
    const fd = formDataRef.current;
    const editor = (() => {
      try {
        const s = fd.get("history") as string | null;
        if (!s) return undefined;
        const parsed = JSON.parse(String(s)) as HistoryState;
        return parsed.editor as HistoryState["editor"] | undefined;
      } catch {
        return undefined;
      }
    })();
    const raw = fd.get("components") as string | null;
    let nextComponents = components;
    try {
      const list = raw ? (JSON.parse(String(raw)) as PageComponent[]) : components;
      // Build globals map for resolving linked instances
      const globalsArr = getGlobals();
      const globalsMap = Object.fromEntries((globalsArr || []).map((g: GlobalItem) => [g.globalId, g.template]));
      nextComponents = exportComponents(list, editor, globalsMap);
    } catch {
      const globalsArr = getGlobals();
      const globalsMap = Object.fromEntries((globalsArr || []).map((g: GlobalItem) => [g.globalId, g.template]));
      nextComponents = exportComponents(components, editor, globalsMap);
    }
    const out = new FormData();
    // copy all existing entries
    for (const [k, v] of fd.entries()) {
      if (k === "components") continue;
      out.append(k, v);
    }
    out.append("components", JSON.stringify(nextComponents));
    return onPublish(out)
      .then(() => {
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'publish', title: t('notify_published') } })); } catch {}
        clearHistory();
      })
      .catch((err) => {
        try { window.dispatchEvent(new CustomEvent('pb:notify', { detail: { type: 'error', title: t('notify_publish_failed'), message: String((err as { message?: unknown })?.message || err) } })); } catch {}
        throw err;
      });
  }, [onPublish, clearHistory, components, getGlobals, t]);

  const { autoSaveState } = useAutoSave({
    onSave: saveWithMetaUpdate,
    formData,
    deps: formDataDeps,
    onError: onAutoSaveError,
  });

  const prevId = useRef(page.id);
  useEffect(() => {
    if (prevId.current !== page.id) {
      clearHistory();
      prevId.current = page.id;
    }
  }, [page.id, clearHistory]);

  const handleRevert = useCallback(
    async (nextComponents: PageComponent[]) => {
      const fd = formDataRef.current;
      const out = new FormData();
      for (const [k, v] of fd.entries()) {
        if (k === "components") continue;
        out.append(k, v);
      }
      out.append("components", JSON.stringify(nextComponents));
      await saveWithMetaUpdate(out);
    },
    [saveWithMetaUpdate],
  );

  return { formData, handlePublish, handleSave, handleRevert, autoSaveState };
}

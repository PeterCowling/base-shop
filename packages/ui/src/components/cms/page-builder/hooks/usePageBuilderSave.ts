"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import useAutoSave from "./useAutoSave";
import { exportComponents } from "../state/exportComponents";

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
  // Lazy import to avoid SSR issues
  const getLibrary = () => {
    try {
      const mod = require("../libraryStore") as typeof import("../libraryStore");
      return mod.listLibrary(shop);
    } catch {
      return [];
    }
  };
  const formData = useMemo(() => {
    const fd = new FormData();
    fd.append("id", page.id);
    fd.append("updatedAt", page.updatedAt);
    fd.append("slug", page.slug);
    fd.append("status", page.status);
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
  }, [page, components, state, shop]);

  const formDataRef = useRef<FormData>(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleSave = useCallback(() => onSave(formDataRef.current), [onSave]);
  const handlePublish = useCallback(() => {
    // Build a transformed FormData merging editor metadata into components
    const fd = formDataRef.current;
    const editor = (() => {
      try {
        const s = fd.get("history") as string | null;
        if (!s) return undefined;
        const parsed = JSON.parse(String(s)) as HistoryState;
        return (parsed as any).editor as HistoryState["editor"] | undefined;
      } catch {
        return undefined;
      }
    })();
    const raw = fd.get("components") as string | null;
    let nextComponents = components;
    try {
      const list = raw ? (JSON.parse(String(raw)) as PageComponent[]) : components;
      nextComponents = exportComponents(list, editor);
    } catch {
      nextComponents = exportComponents(components, editor);
    }
    const out = new FormData();
    // copy all existing entries
    for (const [k, v] of (fd as any).entries() as Iterable<[string, any]>) {
      if (k === "components") continue;
      out.append(k, v);
    }
    out.append("components", JSON.stringify(nextComponents));
    return onPublish(out).then(() => clearHistory());
  }, [onPublish, clearHistory, components]);

  const { autoSaveState } = useAutoSave({
    onSave,
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

  return { formData, handlePublish, handleSave, autoSaveState };
}

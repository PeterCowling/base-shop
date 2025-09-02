"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Page, PageComponent, HistoryState } from "@acme/types";
import useAutoSave from "./useAutoSave";

interface Params {
  page: Page;
  components: PageComponent[];
  state: HistoryState;
  onSave: (fd: FormData) => Promise<unknown>;
  onPublish: (fd: FormData) => Promise<unknown>;
  formDataDeps: unknown[];
  onAutoSaveError?: (retry: () => void) => void;
  clearHistory: () => void;
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
}: Params) {
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
    return fd;
  }, [page, components, state]);

  const formDataRef = useRef<FormData>(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const handleSave = useCallback(() => onSave(formDataRef.current), [onSave]);
  const handlePublish = useCallback(
    () => onPublish(formDataRef.current).then(() => clearHistory()),
    [onPublish, clearHistory]
  );

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

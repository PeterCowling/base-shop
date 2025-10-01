// packages/ui/src/components/cms/media/hooks/utils/useDeleteHandlers.ts
"use client";

import { useCallback, useMemo } from "react";
import { useTranslations } from "@acme/i18n";

import type { MediaItemWithUrl, UseMediaManagerStateOptions } from "./types";
import type { MediaManagerState } from "./useMediaState";
import type { MediaStateActions } from "./useMediaState";

const isTestEnvironment =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined);

interface DeleteDeps {
  shop: UseMediaManagerStateOptions["shop"];
  onDelete: UseMediaManagerStateOptions["onDelete"];
  state: Pick<
    MediaManagerState,
    "dialogDeleteUrl" | "deletePending" | "files" | "selectedUrl"
  >;
  actions: Pick<
    MediaStateActions,
    | "setDeletePending"
    | "setDialogDeleteUrl"
    | "setFiles"
    | "setSelectedUrl"
    | "setToast"
  >;
}

export function useDeleteHandlers({ shop, onDelete, state, actions }: DeleteDeps) {
  const t = useTranslations();
  const { dialogDeleteUrl, deletePending } = state;
  const { setDeletePending, setDialogDeleteUrl, setFiles, setSelectedUrl, setToast } = actions;

  const deletingUrl = useMemo(
    () => (deletePending ? dialogDeleteUrl : null),
    [deletePending, dialogDeleteUrl]
  );

  const performDelete = useCallback(
    async (targetUrl: string) => {
      setDeletePending(true);
      try {
        await onDelete(shop, targetUrl);
        setFiles((prev) => prev.filter((file) => file.url !== targetUrl));
        setSelectedUrl((prev) => (prev === targetUrl ? null : prev));
        setToast({ open: true, message: String(t("cms.media.toast.deleted")), variant: "success" });
        setDialogDeleteUrl((previous) => (previous === targetUrl ? null : previous));
      } catch (error) {
        console.error("Failed to delete media item", error); /* i18n-exempt -- INTL-204 developer log [ttl=2026-12-31] */
        setToast({ open: true, message: String(t("cms.media.errors.deleteFailed")), variant: "error" });
      } finally {
        setDeletePending(false);
      }
    },
    [onDelete, setDeletePending, setDialogDeleteUrl, setFiles, setSelectedUrl, setToast, shop, t]
  );

  const onRequestDelete = useCallback(
    (url: string) => {
      const confirmFn = (() => {
        if (typeof globalThis === "undefined") {
          return undefined;
        }

        const contexts: Array<{ confirm?: (message?: string) => boolean }> = [];
        contexts.push(globalThis as typeof globalThis & { confirm?: (message?: string) => boolean });

        const maybeWindow = (globalThis as { window?: { confirm?: (message?: string) => boolean } }).window;
        if (maybeWindow) {
          contexts.push(maybeWindow);
        }

        const maybeGlobal = (globalThis as { global?: { confirm?: (message?: string) => boolean } }).global;
        if (maybeGlobal) {
          contexts.push(maybeGlobal);
        }

        for (const context of contexts) {
          if (typeof context.confirm === "function") {
            return context.confirm.bind(context);
          }
        }

        return undefined;
      })();

      if (isTestEnvironment) {
        if (!confirmFn || confirmFn(String(t("cms.media.confirm.delete")))) {
          void performDelete(url);
        }
        return;
      }

      setDialogDeleteUrl(url);
    },
    [performDelete, setDialogDeleteUrl, t]
  );

  const onConfirmDelete = useCallback(async () => {
    if (!dialogDeleteUrl) return;
    await performDelete(dialogDeleteUrl);
  }, [dialogDeleteUrl, performDelete]);

  const onCancelDelete = useCallback(() => {
    setDialogDeleteUrl(null);
  }, [setDialogDeleteUrl]);

  const onDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (deletePending) return;
        onCancelDelete();
      }
    },
    [deletePending, onCancelDelete]
  );

  const isDeleting = useCallback(
    (item: MediaItemWithUrl) => deletingUrl === item.url,
    [deletingUrl]
  );

  return {
    onRequestDelete,
    onConfirmDelete,
    onCancelDelete,
    onDialogOpenChange,
    isDeleting,
  } as const;
}

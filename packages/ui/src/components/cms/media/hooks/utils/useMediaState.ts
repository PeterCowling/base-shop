// packages/ui/src/components/cms/media/hooks/utils/useMediaState.ts
"use client";

import { useCallback, useState } from "react";

import type { MediaItem } from "@acme/types";

import type {
  MediaItemWithUrl,
  MediaManagerState,
  StateUpdater,
  ToastState,
} from "./types";
import { ensureHasUrl } from "./utils";

export interface MediaStateActions {
  setFiles: (value: StateUpdater<MediaItemWithUrl[]>) => void;
  setSelectedUrl: (value: StateUpdater<string | null>) => void;
  setDialogDeleteUrl: (value: StateUpdater<string | null>) => void;
  setDeletePending: (value: StateUpdater<boolean>) => void;
  setMetadataPending: (value: StateUpdater<boolean>) => void;
  setReplacingUrl: (value: StateUpdater<string | null>) => void;
  setToast: (value: StateUpdater<ToastState>) => void;
  handleToastClose: () => void;
}

export function useMediaState(initialFiles: MediaItem[]) {
  const [state, setState] = useState<MediaManagerState>(() => ({
    files: ensureHasUrl(initialFiles),
    selectedUrl: null,
    dialogDeleteUrl: null,
    deletePending: false,
    metadataPending: false,
    replacingUrl: null,
    toast: { open: false, message: "" },
  }));

  const setFiles = useCallback(
    (value: StateUpdater<MediaItemWithUrl[]>) => {
      setState((previous) => ({
        ...previous,
        files:
          typeof value === "function"
            ? (value as (prev: MediaItemWithUrl[]) => MediaItemWithUrl[])(
                previous.files
              )
            : value,
      }));
    },
    []
  );

  const setSelectedUrl = useCallback(
    (value: StateUpdater<string | null>) => {
      setState((previous) => ({
        ...previous,
        selectedUrl:
          typeof value === "function"
            ? (value as (prev: string | null) => string | null)(
                previous.selectedUrl
              )
            : value,
      }));
    },
    []
  );

  const setDialogDeleteUrl = useCallback(
    (value: StateUpdater<string | null>) => {
      setState((previous) => ({
        ...previous,
        dialogDeleteUrl:
          typeof value === "function"
            ? (value as (prev: string | null) => string | null)(
                previous.dialogDeleteUrl
              )
            : value,
      }));
    },
    []
  );

  const setDeletePending = useCallback(
    (value: StateUpdater<boolean>) => {
      setState((previous) => ({
        ...previous,
        deletePending:
          typeof value === "function"
            ? (value as (prev: boolean) => boolean)(previous.deletePending)
            : value,
      }));
    },
    []
  );

  const setMetadataPending = useCallback(
    (value: StateUpdater<boolean>) => {
      setState((previous) => ({
        ...previous,
        metadataPending:
          typeof value === "function"
            ? (value as (prev: boolean) => boolean)(previous.metadataPending)
            : value,
      }));
    },
    []
  );

  const setReplacingUrl = useCallback(
    (value: StateUpdater<string | null>) => {
      setState((previous) => ({
        ...previous,
        replacingUrl:
          typeof value === "function"
            ? (value as (prev: string | null) => string | null)(
                previous.replacingUrl
              )
            : value,
      }));
    },
    []
  );

  const setToast = useCallback(
    (value: StateUpdater<ToastState>) => {
      setState((previous) => ({
        ...previous,
        toast:
          typeof value === "function"
            ? (value as (prev: ToastState) => ToastState)(previous.toast)
            : value,
      }));
    },
    []
  );

  const handleToastClose = useCallback(() => {
    setToast((previous) => ({ ...previous, open: false }));
  }, [setToast]);

  const actions: MediaStateActions = {
    setFiles,
    setSelectedUrl,
    setDialogDeleteUrl,
    setDeletePending,
    setMetadataPending,
    setReplacingUrl,
    setToast,
    handleToastClose,
  };

  return { state, actions } as const;
}

export type { MediaManagerState } from "./types";


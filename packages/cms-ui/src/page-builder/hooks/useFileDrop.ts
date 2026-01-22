"use client";
import type { DragEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { ulid } from "ulid";

import type { MediaItem,PageComponent } from "@acme/types";
import useFileUpload from "@acme/ui/hooks/useFileUpload";

import type { Action } from "../state/layout";

interface Options {
  shop: string;
  dispatch: (action: Action) => void;
  /** Optional policy: determine whether an external URL may be ingested */
  allowExternalUrl?: (url: string) => boolean;
  /** Debounce window for drop handling (ms) */
  debounceMs?: number;
}

const useFileDrop = ({ shop, dispatch, allowExternalUrl, debounceMs = 600 }: Options) => {
  const [dragOver, setDragOver] = useState(false);
  const lastDropRef = useRef<number>(0);

  const {
    onDrop,
    processDataTransfer,
    handleUpload,
    isUploading,
    progress,
    isValid,
  } = useFileUpload({
    shop,
    requiredOrientation: "landscape",
    allowExternalUrl,
    onUploaded: (item: MediaItem) => {
      dispatch({
        type: "add",
        component: {
          id: ulid(),
          type: "Image",
          src: item.url,
          alt: item.altText,
        } as PageComponent,
      });
    },
  });

  const handleFileDrop = useCallback(
    async (ev: DragEvent<HTMLDivElement>) => {
      setDragOver(false);
      // Rate-limit to avoid double submits on noisy environments
      const now = Date.now();
      if (now - lastDropRef.current < debounceMs) return;
      lastDropRef.current = now;
      try {
        ev.preventDefault();
        if (isUploading) return;
        // If the newer analyzer is available, use it; otherwise fallback to legacy onDrop
        if (typeof processDataTransfer === "function") {
          const kind = await processDataTransfer(ev);
          if (kind === "file" || kind === "url") {
            if (typeof handleUpload === "function" && !isUploading) await handleUpload();
            return;
          }
          if (kind === "none") {
            if (typeof onDrop === "function") onDrop(ev);
            if (typeof handleUpload === "function" && !isUploading) await handleUpload();
          }
        } else {
          // Back-compat: tests may mock only onDrop
          if (typeof onDrop === "function") onDrop(ev);
          if (typeof handleUpload === "function" && !isUploading) await handleUpload();
        }
      } catch (err) {
        console.error(err);
      }
    },
    [processDataTransfer, onDrop, handleUpload, isUploading, debounceMs]
  );

  return {
    dragOver,
    setDragOver,
    handleFileDrop,
    progress,
    isValid,
  };
};

export default useFileDrop;

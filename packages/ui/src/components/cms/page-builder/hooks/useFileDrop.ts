"use client";
import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";
import { ulid } from "ulid";
import type { PageComponent, MediaItem } from "@acme/types";
import useFileUpload from "../../../../hooks/useFileUpload";
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
        // Try external URL/text/files first via the analyzer
        const analyze = (processDataTransfer as any) as undefined | ((e: DragEvent<HTMLDivElement>) => Promise<"file"|"url"|"text"|"none">);
        const startUpload = (handleUpload as any) as undefined | (() => Promise<void>);
        const uploading = Boolean(isUploading);
        const kind = analyze ? await analyze(ev) : "none";
        if (kind === "file" || kind === "url") {
          // Auto-start upload for canvas drops
          if (startUpload && !uploading) await startUpload();
          return;
        }
        if (kind === "none") {
          // Fallback to legacy handler (files only)
          onDrop(ev);
          if (startUpload && !uploading) await startUpload();
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

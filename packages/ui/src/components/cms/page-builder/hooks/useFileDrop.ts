import { useState, useCallback } from "react";
import type { DragEvent } from "react";
import { ulid } from "ulid";
import type { MediaItem, PageComponent } from "@acme/types";
import useFileUpload from "@ui/hooks/useFileUpload";
import { defaults } from "../defaults";
import type { Action } from "../state";

interface Options {
  shop: string;
  dispatch: React.Dispatch<Action>;
}

export default function useFileDrop({ shop, dispatch }: Options) {
  const [dragOver, setDragOver] = useState(false);

  const { onDrop, progress, isValid } = useFileUpload({
    shop,
    requiredOrientation: "landscape",
    onUploaded: (item: MediaItem) => {
      dispatch({
        type: "add",
        component: {
          id: ulid(),
          type: "Image",
          src: item.url,
          alt: item.altText,
          ...(defaults.Image ?? {}),
        } as PageComponent,
      });
    },
  });

  const handleFileDrop = useCallback(
    (ev: DragEvent<HTMLDivElement>) => {
      setDragOver(false);
      onDrop(ev.dataTransfer).catch((err: unknown) => {
        console.error(err);
      });
    },
    [onDrop]
  );

  return {
    dragOver,
    setDragOver,
    handleFileDrop,
    progress,
    isValid,
  } as const;
}


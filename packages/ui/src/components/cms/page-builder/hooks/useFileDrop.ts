import { useCallback, useState } from "react";
import type { DragEvent } from "react";
import { ulid } from "ulid";
import type { PageComponent, MediaItem } from "@acme/types";
import useFileUpload from "../../../../hooks/useFileUpload";
import { defaults } from "../defaults";
import type { Action } from "../state/actions";

interface Options {
  shop: string;
  dispatch: (action: Action) => void;
}

const useFileDrop = ({ shop, dispatch }: Options) => {
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
      try {
        onDrop(ev);
      } catch (err) {
        console.error(err);
      }
    },
    [onDrop]
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

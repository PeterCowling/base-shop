"use client";

// packages/ui/hooks/useProductMediaManager.tsx
import { useCallback, useMemo } from "react";

import { usePublishLocations } from "@acme/platform-core/hooks/usePublishLocations";
import type { ImageOrientation, MediaItem, PublishLocation } from "@acme/types";

import { useFileUpload } from "./useFileUpload";
import type { ProductWithVariants } from "./useProductInputs";

export interface UseProductMediaManagerResult {
  uploader: React.ReactElement;
  removeMedia: (index: number) => void;
  moveMedia: (from: number, to: number) => void;
}

export function useProductMediaManager(
  shop: string,
  publishTargets: readonly string[],
  setProduct: React.Dispatch<React.SetStateAction<ProductWithVariants>>
): UseProductMediaManagerResult {
  const { locations } = usePublishLocations();
  const requiredOrientation = useMemo(
    () =>
      locations.find(
        (l: PublishLocation & { requiredOrientation?: ImageOrientation }) =>
          l.id === publishTargets[0]
      )?.requiredOrientation ?? "landscape",
    [locations, publishTargets]
  );

  const { uploader } = useFileUpload({
    shop,
    requiredOrientation,
    onUploaded: (item: MediaItem) =>
      setProduct((prev: ProductWithVariants) => ({
        ...prev,
        media: [...prev.media, item],
      })),
  });

  const removeMedia = useCallback(
    (index: number) => {
      setProduct((prev: ProductWithVariants) => ({
        ...prev,
        media: prev.media.filter((_: MediaItem, i: number) => i !== index),
      }));
    },
    [setProduct]
  );

  const moveMedia = useCallback(
    (from: number, to: number) => {
      setProduct((prev: ProductWithVariants) => {
        const gallery = [...prev.media];
        const [moved] = gallery.splice(from, 1);
        gallery.splice(to, 0, moved);
        return { ...prev, media: gallery };
      });
    },
    [setProduct]
  );

  return { uploader, removeMedia, moveMedia };
}

export default useProductMediaManager;

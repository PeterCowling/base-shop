"use client";
import { useEffect, useState } from "react";

import type {
  UseFileUploadOptions,
  UseFileUploadResult,
} from "./useFileUpload";
import { useFileUpload } from "./useFileUpload";

export interface UseMediaUploadResult extends UseFileUploadResult {
  /** Data URL for a preview thumbnail of the selected file */
  thumbnail: string | null;
}

async function createVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(video.src);

    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        cleanup();
        resolve(canvas.toDataURL("image/png"));
      } else {
        cleanup();
        resolve(video.src);
      }
    };
    video.onerror = () => {
      cleanup();
      resolve(video.src);
    };
  });
}

export function useMediaUpload(
  options: UseFileUploadOptions
): UseMediaUploadResult {
  const base = useFileUpload(options);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const file = base.pendingFile;
    if (!file) {
      setThumbnail(null);
      return;
    }

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setThumbnail(url);
      return () => URL.revokeObjectURL(url);
    }

    if (file.type.startsWith("video/")) {
      let active = true;
      createVideoThumbnail(file).then((url) => {
        if (active) setThumbnail(url);
      });
      return () => {
        active = false;
      };
    }
  }, [base.pendingFile]);

  return { ...base, thumbnail };
}

export type { UseFileUploadOptions as UseMediaUploadOptions };
export default useMediaUpload;

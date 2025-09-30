"use client";
import { useCallback, useState } from "react";
import { resizeImageToMaxPx } from "./resize";

export interface DirectUploadResult {
  objectUrl: string;
  key: string;
  width: number;
  height: number;
}

export interface R2UploadProgress { done: number; total: number }

export function useDirectR2Upload() {
  const [progress, setProgress] = useState<R2UploadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File, opts: { idempotencyKey: string; maxPx?: number }): Promise<DirectUploadResult> => {
    setError(null);
    const { idempotencyKey, maxPx = 1600 } = opts;
    // Resize client-side to cap pixel count
    const { blob, width, height } = await resizeImageToMaxPx(file, maxPx);

    // Request presigned URL
    const contentType = blob.type || file.type || "image/jpeg";
    const resp = await fetch("/api/uploads/direct", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType, idempotencyKey, filename: file.name, width, height, sizeBytes: blob.size }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to sign upload (${resp.status})`);
    }
    const info = await resp.json() as any;
    const { objectUrl } = info as { objectUrl: string };

    if (info.post) {
      // Prefer pre-signed POST with conditions when available
      const { url, fields } = info.post ?? {};
      const form = new FormData();
      Object.entries(fields || {}).forEach(([k, v]) => form.append(k, String(v)));
      form.append('file', blob);
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress({ done: e.loaded, total: e.total }); };
        xhr.onload = () => { setProgress(null); if (xhr.status >= 200 && xhr.status < 300) resolve(); else reject(new Error(`Upload failed (${xhr.status})`)); };
        xhr.onerror = () => { setProgress(null); reject(new Error('Network error during upload')); };
        xhr.send(form);
      });
    } else if (info.legacyPut?.uploadUrl) {
      // PUT via XHR to get upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", info.legacyPut.uploadUrl, true);
        const headers = info.legacyPut.headers || {} as Record<string,string>;
        for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress({ done: e.loaded, total: e.total });
        };
        xhr.onload = () => {
          setProgress(null);
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed (${xhr.status})`));
        };
        xhr.onerror = () => {
          setProgress(null);
          reject(new Error("Network error during upload"));
        };
        xhr.send(blob);
      });
    } else {
      throw new Error('Missing upload method');
    }

    return { objectUrl, key: new URL(objectUrl).pathname.slice(1), width, height };
  }, []);

  return { upload, progress, error };
}

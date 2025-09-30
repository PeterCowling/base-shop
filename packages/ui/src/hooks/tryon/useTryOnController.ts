"use client";
import { useCallback, useMemo, useReducer } from "react";
import { tryOnReducer, useTryOnDerived } from "./state";
import { setTryOnCtx, logTryOnEvent } from "./analytics";
import { useDirectR2Upload } from "../tryon/useDirectR2Upload";

export interface EnhancePayload {
  mode: 'garment';
  productId: string;
  sourceImageUrl: string;
  garmentAssets: { flatUrl?: string; exemplarUrl?: string };
  maskUrl?: string;
  depthUrl?: string;
  poseUrl?: string;
}

export function useTryOnController() {
  const [state, dispatch] = useReducer(tryOnReducer, { phase: "idle" });
  const derived = useTryOnDerived(state);
  const { upload, progress: uploadProgress, error } = useDirectR2Upload();
  const t0Ref = { current: 0 } as { current: number };

  const startUpload = useCallback(async (file: File, meta?: { productId?: string; mode?: 'accessory' | 'garment' }) => {
    const jobId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    dispatch({ type: "UPLOAD_START", jobId, productId: meta?.productId, mode: meta?.mode });
    setTryOnCtx({ productId: meta?.productId, mode: meta?.mode, idempotencyKey: jobId });
    t0Ref.current = Date.now();
    // Analytics: TryOnStarted
    try {
      await logTryOnEvent('TryOnStarted');
    } catch {}
    const { objectUrl } = await upload(file, { idempotencyKey: jobId });
    dispatch({ type: "UPLOAD_DONE", sourceImageUrl: objectUrl });
    return { jobId, objectUrl };
  }, [upload]);

  const preprocess = useCallback(async (args: { imageUrl: string; jobId: string }) => {
    const body = JSON.stringify({ imageUrl: args.imageUrl, idempotencyKey: args.jobId });
    const [seg, dep, pose] = await Promise.all([
      fetch("/api/ai/segment", { method: "POST", headers: { "Content-Type": "application/json" }, body }).then(r => r.json()).catch(() => ({})),
      fetch("/api/ai/depth", { method: "POST", headers: { "Content-Type": "application/json" }, body }).then(r => r.json()).catch(() => ({})),
      fetch("/api/ai/pose", { method: "POST", headers: { "Content-Type": "application/json" }, body }).then(r => r.json()).catch(() => ({})),
    ]);
    dispatch({ type: "PREPROCESS_DONE", maskUrl: seg?.maskUrl, depthUrl: dep?.depthUrl, poseUrl: pose?.poseUrl });
    dispatch({ type: "PREVIEW_READY" });
    // Analytics: TryOnPreviewShown
    try { const ms = Date.now() - t0Ref.current; await logTryOnEvent('TryOnPreviewShown', { preprocessMs: ms }); } catch {}
  }, [state]);

  const enhance = useCallback(async (payload: EnhancePayload) => {
    dispatch({ type: "ENHANCE_START" });
    async function runOnce(): Promise<boolean> {
      const ctrl = new AbortController();
      const res = await fetch("/api/tryon/garment", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": (state as any).jobId || "" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) { dispatch({ type: "FAIL", message: `Enhance failed (${res.status})` }); return false; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let gotFinal = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const chunk of lines) {
          const ev = /event: (\w+)/.exec(chunk)?.[1];
          const dataLine = chunk.split("\n").find(l => l.startsWith("data: "));
          const data = dataLine ? JSON.parse(dataLine.slice(6)) : {};
          if (ev === "enhance" && typeof data.progress === "number") {
            dispatch({ type: "ENHANCE_PROGRESS", progress: data.progress });
          } else if (ev === "final" && data.url) {
            gotFinal = true;
            dispatch({ type: "ENHANCE_DONE", resultUrl: data.url });
            try { await logTryOnEvent('TryOnEnhanced'); } catch {}
          } else if (ev === "error") {
            dispatch({ type: "FAIL", message: data.message || "Unknown error" });
            try { await logTryOnEvent('TryOnError', { code: data.code, message: data.message }); } catch {}
          }
        }
      }
      return gotFinal;
    }
    // Simple retry with backoff if stream ended without final
    const ok = await runOnce();
    if (!ok) {
      await new Promise((r) => setTimeout(r, 500));
      await runOnce();
    }
  }, []);

  return useMemo(() => ({ state, ...derived, uploadProgress, error, startUpload, preprocess, enhance }), [state, derived, uploadProgress, error, startUpload, preprocess, enhance]);
}

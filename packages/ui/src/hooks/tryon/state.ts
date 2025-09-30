"use client";
import { useMemo, useReducer } from "react";

export type TryOnPhase =
  | "idle"
  | "uploading"
  | "preprocessed"
  | "preview"
  | "enhancing"
  | "done"
  | "failed";

export interface TryOnState {
  phase: TryOnPhase;
  jobId?: string; // idempotency key
  productId?: string;
  mode?: 'accessory' | 'garment';
  sourceImageUrl?: string;
  maskUrl?: string;
  depthUrl?: string;
  poseUrl?: string;
  resultUrl?: string;
  error?: string;
  progress?: number; // 0..1 for enhance
}

export type TryOnAction =
  | { type: "RESET" }
  | { type: "UPLOAD_START"; jobId: string; productId?: string; mode?: 'accessory' | 'garment' }
  | { type: "UPLOAD_DONE"; sourceImageUrl: string }
  | { type: "PREPROCESS_DONE"; maskUrl?: string; depthUrl?: string; poseUrl?: string }
  | { type: "PREVIEW_READY" }
  | { type: "ENHANCE_START" }
  | { type: "ENHANCE_PROGRESS"; progress: number }
  | { type: "ENHANCE_DONE"; resultUrl: string }
  | { type: "FAIL"; message: string };

export function tryOnReducer(state: TryOnState, action: TryOnAction): TryOnState {
  switch (action.type) {
    case "RESET":
      return { phase: "idle" };
    case "UPLOAD_START":
      return { phase: "uploading", jobId: action.jobId, productId: action.productId, mode: action.mode };
    case "UPLOAD_DONE":
      return { ...state, phase: "preprocessed", sourceImageUrl: action.sourceImageUrl };
    case "PREPROCESS_DONE":
      return { ...state, maskUrl: action.maskUrl, depthUrl: action.depthUrl, poseUrl: action.poseUrl, phase: "preview" };
    case "PREVIEW_READY":
      return { ...state, phase: "preview" };
    case "ENHANCE_START":
      return { ...state, phase: "enhancing", progress: 0 };
    case "ENHANCE_PROGRESS":
      return { ...state, progress: action.progress };
    case "ENHANCE_DONE":
      return { ...state, phase: "done", resultUrl: action.resultUrl, progress: 1 };
    case "FAIL":
      return { ...state, phase: "failed", error: action.message };
    default:
      return state;
  }
}

export function useTryOnDerived(state: TryOnState) {
  return useMemo(() => ({
    canEnhance: state.phase === "preview",
    canAdjust: state.phase === "preview" || state.phase === "enhancing",
    error: state.error,
    progress: state.progress ?? null,
  }), [state]);
}

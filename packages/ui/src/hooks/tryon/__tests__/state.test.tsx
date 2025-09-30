import { renderHook } from "@testing-library/react";
import { tryOnReducer, useTryOnDerived, type TryOnState } from "../state";

describe("tryOnReducer", () => {
  const base: TryOnState = { phase: "idle" };

  it("resets to idle", () => {
    expect(tryOnReducer({ ...base, phase: "failed" }, { type: "RESET" })).toEqual({ phase: "idle" });
  });

  it("stores upload details", () => {
    const state = tryOnReducer(base, { type: "UPLOAD_START", jobId: "job", productId: "prod", mode: "garment" });
    expect(state).toEqual({ phase: "uploading", jobId: "job", productId: "prod", mode: "garment" });
  });

  it("marks upload as done", () => {
    const uploading = { phase: "uploading", jobId: "job" } as TryOnState;
    const state = tryOnReducer(uploading, { type: "UPLOAD_DONE", sourceImageUrl: "src" });
    expect(state).toEqual({ ...uploading, phase: "preprocessed", sourceImageUrl: "src" });
  });

  it("applies preprocess results", () => {
    const preprocessed = tryOnReducer(
      { phase: "preprocessed", sourceImageUrl: "src" },
      { type: "PREPROCESS_DONE", maskUrl: "mask", depthUrl: "depth", poseUrl: "pose" }
    );
    expect(preprocessed).toEqual({ phase: "preview", sourceImageUrl: "src", maskUrl: "mask", depthUrl: "depth", poseUrl: "pose" });
  });

  it("keeps preview state when already ready", () => {
    const preview = tryOnReducer({ phase: "preprocessed" }, { type: "PREVIEW_READY" });
    expect(preview.phase).toBe("preview");
  });

  it("tracks enhance progress and completion", () => {
    const enhancing = tryOnReducer({ phase: "preview" }, { type: "ENHANCE_START" });
    expect(enhancing).toEqual({ phase: "enhancing", progress: 0 });
    const progress = tryOnReducer(enhancing, { type: "ENHANCE_PROGRESS", progress: 0.5 });
    expect(progress).toEqual({ phase: "enhancing", progress: 0.5 });
    const done = tryOnReducer(progress, { type: "ENHANCE_DONE", resultUrl: "result" });
    expect(done).toEqual({ phase: "done", progress: 1, resultUrl: "result" });
  });

  it("records failures", () => {
    const failed = tryOnReducer({ phase: "enhancing" }, { type: "FAIL", message: "nope" });
    expect(failed).toEqual({ phase: "failed", error: "nope" });
  });

  it("returns the same state for unknown actions", () => {
    const state = { phase: "preview" } as TryOnState;
    expect(tryOnReducer(state, { type: "UNKNOWN" } as any)).toBe(state);
  });
});

describe("useTryOnDerived", () => {
  it("computes derived flags and mirrors errors", () => {
    const state: TryOnState = { phase: "enhancing", progress: 0.4, error: "boom" };
    const { result, rerender } = renderHook(({ value }) => useTryOnDerived(value), { initialProps: { value: state } });
    expect(result.current).toEqual({ canEnhance: false, canAdjust: true, error: "boom", progress: 0.4 });

    rerender({ value: { phase: "preview", error: undefined, progress: undefined } });
    expect(result.current).toEqual({ canEnhance: true, canAdjust: true, error: undefined, progress: null });
  });
});

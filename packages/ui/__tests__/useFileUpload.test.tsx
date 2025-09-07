import { act, renderHook } from "@testing-library/react";
import useFileUpload from "../src/hooks/useFileUpload";

const originalFetch = global.fetch;

describe("useFileUpload", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("reports progress and cleans up on success", async () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    let resolveFetch: (v: any) => void;
    global.fetch = jest.fn(() =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    ) as any;
    const onUploaded = jest.fn();
    const { result } = renderHook(() =>
      useFileUpload({ shop: "s", requiredOrientation: "landscape", onUploaded })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
      result.current.setAltText("alt");
      result.current.setTags("tag");
    });

    await act(async () => {
      const p = result.current.handleUpload();
      expect(result.current.progress).toEqual({ done: 0, total: 1 });
      resolveFetch!({
        ok: true,
        json: () => Promise.resolve({ url: "/img.png", altText: "", type: "image" }),
      });
      await p;
    });

    expect(onUploaded).toHaveBeenCalled();
    expect(result.current.error).toBeUndefined();
    expect(result.current.progress).toBeNull();
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.altText).toBe("");
    expect(result.current.tags).toBe("");
  });

  it("handles network errors and resets state", async () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    let rejectFetch: (e: any) => void;
    global.fetch = jest.fn(
      () =>
        new Promise((_, reject) => {
          rejectFetch = reject;
        })
    ) as any;

    const { result } = renderHook(() =>
      useFileUpload({ shop: "s", requiredOrientation: "landscape" })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
    });

    await act(async () => {
      const p = result.current.handleUpload();
      expect(result.current.progress).toEqual({ done: 0, total: 1 });
      rejectFetch!(new Error("fail"));
      await p;
    });

    expect(result.current.error).toBe("fail");
    expect(result.current.progress).toBeNull();
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.altText).toBe("");
    expect(result.current.tags).toBe("");
  });
});


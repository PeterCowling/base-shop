import { act, renderHook } from "@testing-library/react";

import useImageUpload from "../src/hooks/useFileUpload";

const originalFetch = global.fetch;

describe("useImageUpload alias", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("completes upload and clears state", async () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    let resolveFetch: (v: any) => void;
    global.fetch = jest.fn(() => new Promise((resolve) => (resolveFetch = resolve))) as any;

    const { result } = renderHook(() =>
      useImageUpload({ shop: "s", requiredOrientation: "landscape" })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
    });

    await act(async () => {
      const p = result.current.handleUpload();
      expect(result.current.progress).toEqual({ done: 0, total: 1 });
      resolveFetch!({ ok: true, json: () => Promise.resolve({}) });
      await p;
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.progress).toBeNull();
  });

  it("records error for failed upload", async () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    let rejectFetch: (e: any) => void;
    global.fetch = jest.fn(
      () => new Promise((_, reject) => (rejectFetch = reject))
    ) as any;

    const { result } = renderHook(() =>
      useImageUpload({ shop: "s", requiredOrientation: "landscape" })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
    });

    await act(async () => {
      const p = result.current.handleUpload();
      expect(result.current.progress).toEqual({ done: 0, total: 1 });
      rejectFetch!(new Error("oops"));
      await p;
    });

    expect(result.current.error).toBe("oops");
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.progress).toBeNull();
  });
});


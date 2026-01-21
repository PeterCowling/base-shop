import { act, renderHook } from "@testing-library/react";

import useMediaUpload from "../src/hooks/useMediaUpload";

const originalFetch = global.fetch;

describe("useMediaUpload", () => {
  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("generates and clears thumbnail on success", async () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    let resolveFetch: (v: any) => void;
    global.fetch = jest.fn(() => new Promise((resolve) => (resolveFetch = resolve))) as any;
    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useMediaUpload({ shop: "s", requiredOrientation: "landscape" })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
    });

    expect(result.current.thumbnail).toBe("blob:test");
    expect(createSpy).toHaveBeenCalledWith(file);

    await act(async () => {
      const p = result.current.handleUpload();
      expect(result.current.progress).toEqual({ done: 0, total: 1 });
      resolveFetch!({ ok: true, json: () => Promise.resolve({}) });
      await p;
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.thumbnail).toBeNull();
    expect(result.current.progress).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith("blob:test");
  });

  it("handles upload failure and cleans up thumbnail", async () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    let rejectFetch: (e: any) => void;
    global.fetch = jest.fn(
      () => new Promise((_, reject) => (rejectFetch = reject))
    ) as any;
    const createSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    const { result } = renderHook(() =>
      useMediaUpload({ shop: "s", requiredOrientation: "landscape" })
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
    expect(result.current.thumbnail).toBeNull();
    expect(result.current.progress).toBeNull();
    expect(revokeSpy).toHaveBeenCalledWith("blob:test");

    createSpy.mockRestore();
    revokeSpy.mockRestore();
  });
});


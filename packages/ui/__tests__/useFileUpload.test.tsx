import { act, fireEvent, render, renderHook } from "@testing-library/react";
import useFileUpload from "../src/hooks/useFileUpload";
import { useImageOrientationValidation } from "../src/hooks/useImageOrientationValidation";

function createShadcnStub() {
  const React = require("react");
  return {
    Button: React.forwardRef((props: any, ref: any) => (
      <button ref={ref} {...props} />
    )),
  };
}

jest.mock("@/components/atoms/shadcn", createShadcnStub);
jest.mock("../src/components/atoms/shadcn", createShadcnStub);
jest.mock("../src/hooks/useImageOrientationValidation");

const originalFetch = global.fetch;
const mockOrientation = useImageOrientationValidation as jest.Mock;

describe("useFileUpload", () => {
  beforeEach(() => {
    mockOrientation.mockReturnValue({ actual: null, isValid: null });
  });
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

  it("does not fetch when no file is pending", async () => {
    global.fetch = jest.fn();
    const { result } = renderHook(() =>
      useFileUpload({ shop: "s", requiredOrientation: "landscape" })
    );

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles drag events and drop", () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    const { result } = renderHook(() =>
      useFileUpload({ shop: "s", requiredOrientation: "landscape" })
    );
    const { container, rerender } = render(result.current.uploader);

    fireEvent.dragEnter(container.firstChild!);
    rerender(result.current.uploader);
    expect(container.firstChild?.className).toContain("highlighted");

    act(() => {
      fireEvent.drop(container.firstChild!, {
        dataTransfer: { files: [file] },
      });
    });
    rerender(result.current.uploader);

    expect(result.current.pendingFile).toBe(file);
    expect(container.firstChild?.className).not.toContain("highlighted");
  });

  it("shows orientation warning when mismatched", () => {
    mockOrientation
      .mockReturnValueOnce({ actual: null, isValid: null })
      .mockReturnValue({ actual: "portrait", isValid: false });

    const file = new File(["a"], "a.png", { type: "image/png" });
    const { result } = renderHook(() =>
      useFileUpload({ shop: "s", requiredOrientation: "landscape" })
    );
    const { getByText, rerender } = render(result.current.uploader);

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
    });
    rerender(result.current.uploader);

    expect(
      getByText("Wrong orientation (needs landscape)")
    ).toBeInTheDocument();
  });

  it("handles error responses with custom message", async () => {
    const file = new File(["a"], "a.png", { type: "image/png" });
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        statusText: "nope",
        json: () => Promise.resolve({ error: "bad" }),
      })
    ) as any;

    const { result } = renderHook(() =>
      useFileUpload({ shop: "s", requiredOrientation: "landscape" })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.error).toBe("bad");
  });
});


import { act, render, renderHook } from "@testing-library/react";

import ImageUploaderWithOrientationCheck from "../../components/cms/ImageUploaderWithOrientationCheck";
import useImageUpload from "../useFileUpload";
import { useImageUpload as useLocalImageUpload } from "../useImageUpload";

// The component import above uses a relative path, so the mock must mirror it
// to ensure Jest intercepts the module correctly. Using the `@acme/ui` alias here
// would create a separate module entry and the import would not be mocked,
// causing the test to receive a React component instead of a Jest mock.
jest.mock("../../components/cms/ImageUploaderWithOrientationCheck", () => {
  return {
    __esModule: true,
    default: jest.fn(({ file }: { file: File | null }) => (
      <div data-cy="uploader">{file ? file.name : "none"}</div>
    )),
  };
});

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: () => ({ actual: "landscape", isValid: true }),
}));

const mockComponent = ImageUploaderWithOrientationCheck as jest.MockedFunction<
  typeof ImageUploaderWithOrientationCheck
>;

describe("useImageUpload", () => {
  afterEach(() => {
    mockComponent.mockClear();
  });

  it("updates file state and renders uploader", () => {
    const { result } = renderHook(() => useLocalImageUpload("landscape"));

    const { getByTestId, rerender } = render(result.current.uploader);
    expect(mockComponent).toHaveBeenCalledWith(
      expect.objectContaining({ file: null, requiredOrientation: "landscape" }),
      undefined
    );
    expect(getByTestId("uploader").textContent).toBe("none");

    const file = new File(["a"], "test.png", { type: "image/png" });
    act(() => {
      result.current.setFile(file);
    });

    rerender(result.current.uploader);

    expect(result.current.file).toBe(file);
    expect(mockComponent).toHaveBeenLastCalledWith(
      expect.objectContaining({ file, requiredOrientation: "landscape" }),
      undefined
    );
    expect(getByTestId("uploader").textContent).toBe("test.png");
  });
});

describe("useImageUpload upload errors", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  const file = new File(["x"], "x.png", { type: "image/png" });

  it("surfaces error when fetch rejects and skips success callback", async () => {
    const onUploaded = jest.fn();
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("network"));
    (global as any).fetch = fetchMock;

    const { result } = renderHook(() =>
      useImageUpload({ shop: "s", requiredOrientation: "landscape", onUploaded })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
      result.current.setAltText("alt");
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.error).toBe("network");
    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.altText).toBe("");
    expect(result.current.progress).toBeNull();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("surfaces error when fetch returns non-OK and skips success callback", async () => {
    const onUploaded = jest.fn();
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      statusText: "bad",
      json: () => Promise.resolve({ error: "bad" }),
    });
    (global as any).fetch = fetchMock;

    const { result } = renderHook(() =>
      useImageUpload({ shop: "s", requiredOrientation: "landscape", onUploaded })
    );

    act(() => {
      result.current.onFileChange({ target: { files: [file] } } as any);
      result.current.setAltText("alt");
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    expect(result.current.error).toBe("bad");
    expect(onUploaded).not.toHaveBeenCalled();
    expect(result.current.pendingFile).toBeNull();
    expect(result.current.altText).toBe("");
    expect(result.current.progress).toBeNull();
    expect(fetchMock).toHaveBeenCalled();
  });
});

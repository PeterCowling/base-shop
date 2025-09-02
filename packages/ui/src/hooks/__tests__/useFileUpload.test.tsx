import { act, renderHook } from "@testing-library/react";

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(),
}));

const { useImageOrientationValidation } = require("../useImageOrientationValidation.ts");
const { useFileUpload } = require("../useFileUpload.tsx");

const mockOrientation = useImageOrientationValidation as jest.MockedFunction<
  typeof useImageOrientationValidation
>;

const originalFetch = global.fetch;
const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ url: "/img.png", altText: "", type: "image" }),
  } as any);
  (global as any).fetch = mockFetch;
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
});

afterEach(() => {
  (global as any).fetch = originalFetch;
  jest.clearAllMocks();
});

it("uploads image, splits tags and resets state on success", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
    result.current.setAltText("alt");
    result.current.setTags("tag1, tag2");
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  const body = mockFetch.mock.calls[0][1].body as FormData;
  expect(body.get("tags")).toBe(JSON.stringify(["tag1", "tag2"]));

  expect(result.current.progress).toBeNull();
  expect(result.current.pendingFile).toBeNull();
  expect(result.current.altText).toBe("");
  expect(result.current.tags).toBe("");
  expect(result.current.error).toBeUndefined();
});

it("resets state and sets error when upload fails", async () => {
  mockFetch.mockRejectedValueOnce(new Error("fail"));
  const file = new File(["x"], "x.png", { type: "image/png" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
    result.current.setAltText("alt");
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(result.current.error).toBe("fail");
  expect(result.current.progress).toBeNull();
  expect(result.current.pendingFile).toBeNull();
  expect(result.current.altText).toBe("");
});

it("bypasses orientation validation for video files", async () => {
  mockOrientation.mockReturnValue({ actual: "portrait", isValid: false });
  const file = new File(["v"], "v.mp4", { type: "video/mp4" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });

  expect(mockOrientation).toHaveBeenCalledWith(null, "landscape");
  expect(result.current.isValid).toBe(true);

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(result.current.pendingFile).toBeNull();
});

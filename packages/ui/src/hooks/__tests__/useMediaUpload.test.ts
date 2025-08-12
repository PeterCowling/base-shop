import { act, renderHook, waitFor } from "@testing-library/react";

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(),
}));

const {
  useImageOrientationValidation,
} = require("../useImageOrientationValidation.ts");
const { useMediaUpload } = require("../useMediaUpload.tsx");
const mockOrientation = useImageOrientationValidation as jest.MockedFunction<
  typeof useImageOrientationValidation
>;

beforeEach(() => {
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ url: "/img.png", altText: "" }),
  } as any);
});

it("updates progress during upload", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  const { result } = renderHook(() =>
    useMediaUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });

  await waitFor(() => expect(result.current.pendingFile).not.toBeNull());

  let resolveUpload: (v: any) => void = () => {};
  (global.fetch as jest.Mock).mockImplementationOnce(
    () => new Promise((r) => (resolveUpload = r as any))
  );

  act(() => {
    result.current.handleUpload();
  });

  await waitFor(() =>
    expect(result.current.progress).toEqual({ done: 0, total: 1 })
  );

  resolveUpload({ url: "/img.png" });
  await act(async () => {
    await Promise.resolve();
  });

  expect(result.current.progress).toBeNull();
});

it("sets error when upload fails", async () => {
  (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("fail"));
  const file = new File(["x"], "x.png", { type: "image/png" });
  const { result } = renderHook(() =>
    useMediaUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(result.current.error).toBe("fail");
  expect(result.current.pendingFile).toBeNull();
});

it("clears file and alt text after upload", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  const { result } = renderHook(() =>
    useMediaUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
    result.current.setAltText("alt");
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(result.current.pendingFile).toBeNull();
  expect(result.current.altText).toBe("");
});

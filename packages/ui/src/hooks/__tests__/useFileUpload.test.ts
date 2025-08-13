import { act, renderHook, waitFor } from "@testing-library/react";

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
  mockOrientation.mockReturnValue({ actual: "landscape", isValid: true });
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ url: "/img.png", altText: "", type: "image" }),
  } as any);
  (global as any).fetch = mockFetch;
});

afterEach(() => {
  (global as any).fetch = originalFetch;
  jest.clearAllMocks();
});

it("updates progress during upload", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });

  await waitFor(() => expect(result.current.pendingFile).not.toBeNull());

  let resolveFetch: (v: any) => void = () => {};
  mockFetch.mockImplementationOnce(
    () => new Promise((r) => (resolveFetch = r)) as any
  );

  act(() => {
    result.current.handleUpload();
  });

  await waitFor(() =>
    expect(result.current.progress).toEqual({ done: 0, total: 1 })
  );

  resolveFetch({ ok: true, json: () => Promise.resolve({ url: "/img.png" }) });
  await act(async () => {
    await Promise.resolve();
  });

  expect(result.current.progress).toBeNull();
});

it("sets error when upload fails", async () => {
  mockFetch.mockRejectedValueOnce(new Error("fail"));
  const file = new File(["x"], "x.png", { type: "image/png" });
  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
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

  expect(result.current.pendingFile).toBeNull();
  expect(result.current.altText).toBe("");
  expect(result.current.tags).toBe("");
});

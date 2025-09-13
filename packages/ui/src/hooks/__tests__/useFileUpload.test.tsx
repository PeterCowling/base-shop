import { act, fireEvent, render, renderHook } from "@testing-library/react";

jest.mock("../useImageOrientationValidation.ts", () => ({
  useImageOrientationValidation: jest.fn(),
}));

const { useImageOrientationValidation } = require("../useImageOrientationValidation.ts");
const { useFileUpload } = require("../useFileUpload.tsx");

const mockOrientation =
  useImageOrientationValidation as jest.MockedFunction<
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

it("uploads image and splits tags", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  const onUploaded = jest.fn();

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape", onUploaded })
  );

  mockOrientation.mockClear();

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
    result.current.setAltText("alt");
    result.current.setTags("tag1, tag2");
  });

  await act(async () => {
    const promise = result.current.handleUpload();
    expect(result.current.progress).toEqual({ done: 0, total: 1 });
    await promise;
  });

  expect(result.current.progress).toBeNull();
  const body = mockFetch.mock.calls[0][1].body as FormData;
  expect(body.get("tags")).toBe(JSON.stringify(["tag1", "tag2"]));
  expect(onUploaded).toHaveBeenCalled();
  expect(result.current.error).toBeUndefined();
});

it("sets error when upload fetch rejects", async () => {
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
});

it("renders error message when upload fetch rejects", async () => {
  mockFetch.mockRejectedValueOnce(new Error("fail"));
  const file = new File(["x"], "x.png", { type: "image/png" });

  const { result, rerender: rerenderHook } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );
  const { getByText, rerender } = render(result.current.uploader);

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });
  rerenderHook();
  rerender(result.current.uploader);

  await act(async () => {
    await result.current.handleUpload();
  });
  rerenderHook();
  rerender(result.current.uploader);

  expect(getByText("fail")).toBeInTheDocument();
});

it("ignores non-Error rejections", async () => {
  mockFetch.mockRejectedValueOnce("oops");
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

  expect(result.current.error).toBeUndefined();
});

it("marks file invalid when orientation mismatches", () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  mockOrientation.mockReturnValue({ actual: "portrait", isValid: false });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });

  expect(mockOrientation).toHaveBeenCalledWith(file, "landscape");
  expect(result.current.isValid).toBe(false);
  expect(result.current.actual).toBe("portrait");
});

it("aborts upload and reports orientation mismatch", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  mockOrientation.mockReturnValue({ actual: "portrait", isValid: false });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(mockFetch).not.toHaveBeenCalled();
  expect(result.current.error).toBe(
    "Image orientation mismatch: expected landscape, got portrait",
  );
});

it("aborts upload and reports orientation mismatch when actual is null", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  mockOrientation.mockReturnValue({ actual: null, isValid: false });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(mockFetch).not.toHaveBeenCalled();
  expect(result.current.error).toBe(
    "Image orientation mismatch: expected landscape",
  );
});

it("shows warning and blocks upload when orientation validation fails", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });
  mockOrientation.mockReturnValue({ actual: "portrait", isValid: false });

  const { result, rerender: rerenderHook } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );
  const { getByText, rerender } = render(result.current.uploader);

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
  });
  rerenderHook();
  rerender(result.current.uploader);

  expect(
    getByText("Wrong orientation (needs landscape)")
  ).toBeInTheDocument();

  await act(async () => {
    await result.current.handleUpload();
  });
  rerenderHook();
  rerender(result.current.uploader);

  expect(mockFetch).not.toHaveBeenCalled();
  expect(
    getByText(
      "Image orientation mismatch: expected landscape, got portrait",
    ),
  ).toBeInTheDocument();
});

it("skips orientation validation for videos", async () => {
  const file = new File(["v"], "v.mp4", { type: "video/mp4" });
  const onUploaded = jest.fn();

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape", onUploaded })
  );

  await act(async () => {});
  mockOrientation.mockClear();

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
    result.current.setAltText("alt");
    result.current.setTags("tag");
  });

  expect(mockOrientation).toHaveBeenCalledWith(null, "landscape");
  expect(result.current.isValid).toBe(true);
  expect(result.current.actual).toBeNull();

  await act(async () => {
    await result.current.handleUpload();
  });

  const body = mockFetch.mock.calls[0][1].body as FormData;
  expect(body.get("file")).toBe(file);
  expect(onUploaded).toHaveBeenCalled();
  expect(result.current.pendingFile).toBeNull();
  expect(result.current.altText).toBe("");
  expect(result.current.tags).toBe("");
});

it("updates pending file on drag-and-drop", () => {
  const file = new File(["d"], "d.png", { type: "image/png" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  mockOrientation.mockClear();

  act(() => {
    result.current.onDrop({
      preventDefault: jest.fn(),
      dataTransfer: { files: [file] },
    } as any);
  });

  expect(result.current.pendingFile).toBe(file);
  expect(result.current.altText).toBe("");
  expect(result.current.tags).toBe("");
  expect(mockOrientation).toHaveBeenCalledWith(file, "landscape");
});

it("opens file dialog when pressing Enter on uploader", () => {
  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  const { getByLabelText, container } = render(result.current.uploader);
  const input = container.querySelector("input") as HTMLInputElement;
  const clickSpy = jest.spyOn(input, "click");

  const dropzone = getByLabelText(
    "Drop image or video here or press Enter to browse"
  );

  act(() => {
    fireEvent.keyDown(dropzone, { key: "Enter" });
    fireEvent.keyDown(dropzone, { key: " " });
  });

  expect(clickSpy).toHaveBeenCalledTimes(2);
});

it("highlights dropzone on drag enter and removes highlight on drag leave", () => {
  const Wrapper = () =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" }).uploader;

  const { getByLabelText } = render(<Wrapper />);
  const dropzone = getByLabelText(
    "Drop image or video here or press Enter to browse"
  );

  act(() => {
    fireEvent.dragOver(dropzone);
    fireEvent.dragEnter(dropzone);
  });
  expect(dropzone.className).toContain("highlighted");

  act(() => {
    fireEvent.dragLeave(dropzone);
  });
  expect(dropzone.className).not.toContain("highlighted");
});

it("returns early when no file is pending", async () => {
  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  await act(async () => {
    await result.current.handleUpload();
  });

  expect(mockFetch).not.toHaveBeenCalled();
});

it("sets error when response is not ok", async () => {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: "bad" }),
    statusText: "bad", 
  } as any);
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

  expect(result.current.error).toBe("bad");
});

it("ignores empty tags after trimming", async () => {
  const file = new File(["x"], "x.png", { type: "image/png" });

  const { result } = renderHook(() =>
    useFileUpload({ shop: "s", requiredOrientation: "landscape" })
  );

  act(() => {
    result.current.onFileChange({ target: { files: [file] } } as any);
    result.current.setTags(" , ");
  });

  await act(async () => {
    await result.current.handleUpload();
  });

  const body = mockFetch.mock.calls[mockFetch.mock.calls.length - 1][1]
    .body as FormData;
  expect(body.has("tags")).toBe(false);
  expect(result.current.error).toBeUndefined();
});


import { act, renderHook } from "@testing-library/react";
import { useDirectR2Upload } from "../useDirectR2Upload";
import { resizeImageToMaxPx } from "../resize";

jest.mock("../resize", () => ({
  resizeImageToMaxPx: jest.fn(),
}));

describe("useDirectR2Upload", () => {
  const file = new File(["file"], "photo.png", { type: "image/png" });
  const originalFetch = global.fetch;
  const originalXHR = global.XMLHttpRequest;

  beforeEach(() => {
    jest.resetAllMocks();
    (resizeImageToMaxPx as jest.Mock).mockResolvedValue({
      blob: new Blob(["blob"], { type: "image/png" }),
      width: 1200,
      height: 900,
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.XMLHttpRequest = originalXHR as any;
  });

  it("uploads via presigned POST and reports progress", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objectUrl: "https://cdn.example.com/photo.png",
        post: { url: "https://upload", fields: { key: "value" } },
      }),
    });
    global.fetch = fetchMock as any;

    class MockXHR {
      status = 204;
      upload: any = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      send = jest.fn(() => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 });
        this.onload?.();
      });
      setRequestHeader = jest.fn();
    }
    global.XMLHttpRequest = jest.fn(() => new MockXHR()) as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      const info = await result.current.upload(file, { idempotencyKey: "abc", maxPx: 1000 });
      expect(info).toMatchObject({ key: "photo.png", width: 1200, height: 900 });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/uploads/direct",
      expect.objectContaining({ method: "POST" })
    );
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("uploads via legacy PUT when provided", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objectUrl: "https://cdn.example.com/photo.png",
        legacyPut: { uploadUrl: "https://put", headers: undefined },
      }),
    });
    global.fetch = fetchMock as any;

    class MockXHR {
      status = 201;
      upload: any = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      headers: Record<string, string> = {};
      open = jest.fn();
      setRequestHeader = jest.fn((k: string, v: string) => {
        this.headers[k] = v;
      });
      send = jest.fn(() => {
        this.upload.onprogress?.({ lengthComputable: true, loaded: 10, total: 10 });
        this.onload?.();
      });
    }
    global.XMLHttpRequest = jest.fn(() => new MockXHR()) as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      const info = await result.current.upload(file, { idempotencyKey: "def" });
      expect(info).toMatchObject({ key: "photo.png", width: 1200, height: 900 });
    });
  });

  it("falls back to the file content type and tolerates missing POST fields", async () => {
    (resizeImageToMaxPx as jest.Mock).mockResolvedValueOnce({
      blob: new Blob(["blob"]),
      width: 640,
      height: 480,
    });
    const info: any = { objectUrl: "https://cdn.example.com/photo.png" };
    let firstPostAccess = true;
    Object.defineProperty(info, "post", {
      get: jest.fn(() => {
        if (firstPostAccess) {
          firstPostAccess = false;
          return { url: "https://upload", fields: undefined };
        }
        return undefined;
      }),
    });
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => info,
    });
    global.fetch = fetchMock as any;

    class MockXHR {
      status = 204;
      upload: any = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      send = jest.fn(() => {
        this.upload.onprogress?.({ lengthComputable: false, loaded: 5, total: 10 });
        this.onload?.();
      });
      setRequestHeader = jest.fn();
    }
    global.XMLHttpRequest = jest.fn(() => new MockXHR()) as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      await result.current.upload(file, { idempotencyKey: "fallback", maxPx: 2000 });
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(requestInit.body as string).contentType).toBe(file.type);
    expect(result.current.progress).toBeNull();
    expect((global.XMLHttpRequest as jest.Mock).mock.results[0].value.open).toHaveBeenCalledWith(
      "POST",
      "https://upload",
      true,
    );
  });

  it("throws when the API response is not ok", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("no json");
      },
    });
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      await expect(result.current.upload(file, { idempotencyKey: "ghi" })).rejects.toThrow("Failed to sign upload (500)");
    });
  });

  it("throws when the presigned POST upload returns a non-success status", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objectUrl: "https://cdn.example.com/photo.png",
        post: { url: "https://upload", fields: {} },
      }),
    });
    global.fetch = fetchMock as any;

    class MockXHR {
      status = 400;
      upload: any = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      send = jest.fn(() => {
        this.onload?.();
      });
      setRequestHeader = jest.fn();
    }
    global.XMLHttpRequest = jest.fn(() => new MockXHR()) as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      await expect(result.current.upload(file, { idempotencyKey: "xyz" })).rejects.toThrow("Upload failed (400)");
    });
  });

  it("throws when a presigned POST upload encounters a network error", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objectUrl: "https://cdn.example.com/photo.png",
        post: { url: "https://upload", fields: {} },
      }),
    });
    global.fetch = fetchMock as any;

    class MockXHR {
      status = 0;
      upload: any = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      send = jest.fn(() => {
        this.onerror?.();
      });
      setRequestHeader = jest.fn();
    }
    global.XMLHttpRequest = jest.fn(() => new MockXHR()) as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      await expect(result.current.upload(file, { idempotencyKey: "net" })).rejects.toThrow("Network error during upload");
    });
  });

  it("throws when a legacy PUT upload returns a non-success status", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objectUrl: "https://cdn.example.com/photo.png",
        legacyPut: { uploadUrl: "https://put", headers: { "x-test": "1" } },
      }),
    });
    global.fetch = fetchMock as any;

    class MockXHR {
      status = 500;
      upload: any = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = jest.fn(() => {
        this.onload?.();
      });
    }
    global.XMLHttpRequest = jest.fn(() => new MockXHR()) as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      await expect(result.current.upload(file, { idempotencyKey: "put" })).rejects.toThrow("Upload failed (500)");
    });
  });

  it("throws when a legacy PUT upload hits a network error", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        objectUrl: "https://cdn.example.com/photo.png",
        legacyPut: { uploadUrl: "https://put", headers: {} },
      }),
    });
    global.fetch = fetchMock as any;

    class MockXHR {
      status = 0;
      upload: any = { onprogress: null };
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      open = jest.fn();
      setRequestHeader = jest.fn();
      send = jest.fn(() => {
        this.onerror?.();
      });
    }
    global.XMLHttpRequest = jest.fn(() => new MockXHR()) as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      await expect(result.current.upload(file, { idempotencyKey: "put-net" })).rejects.toThrow("Network error during upload");
    });
  });
  it("throws when no upload method is returned", async () => {
    const fileWithoutType = new File(["file"], "photo", { type: "" });
    (resizeImageToMaxPx as jest.Mock).mockResolvedValueOnce({
      blob: new Blob(["blob"]),
      width: 100,
      height: 50,
    });
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ objectUrl: "https://cdn.example.com/photo.png" }),
    });
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useDirectR2Upload());

    await act(async () => {
      await expect(result.current.upload(fileWithoutType, { idempotencyKey: "jkl" })).rejects.toThrow("Missing upload method");
    });

    const [, requestInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(requestInit.body as string).contentType).toBe("image/jpeg");
  });
});

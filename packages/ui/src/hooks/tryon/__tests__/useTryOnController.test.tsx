import { act, renderHook, waitFor } from "@testing-library/react";

import { logTryOnEvent,setTryOnCtx } from "../analytics";
import { useDirectR2Upload } from "../useDirectR2Upload";
import { useTryOnController } from "../useTryOnController";

jest.mock("../useDirectR2Upload", () => ({
  useDirectR2Upload: jest.fn(),
}));

jest.mock("../analytics", () => ({
  setTryOnCtx: jest.fn(),
  logTryOnEvent: jest.fn(),
}));

type MockResponse = {
  ok: boolean;
  status?: number;
  body?: { getReader(): { read(): Promise<{ done: boolean; value?: Uint8Array }> } };
};

function createStream(chunks: string[]): MockResponse["body"] {
  let index = 0;
  const encoder = new TextEncoder();
  return {
    getReader() {
      return {
        read: jest.fn(async () => {
          if (index < chunks.length) {
            const value = encoder.encode(chunks[index++]);
            return { done: false, value };
          }
          return { done: true };
        }),
      };
    },
  };
}

describe("useTryOnController", () => {
  const file = new File(["avatar"], "avatar.png", { type: "image/png" });
  const uploadMock = jest.fn();
  const originalFetch = global.fetch;
  const originalCrypto = global.crypto;

  beforeEach(() => {
    jest.resetAllMocks();
    (useDirectR2Upload as jest.Mock).mockReturnValue({ upload: uploadMock, progress: { done: 1, total: 2 }, error: "err" });
    uploadMock.mockResolvedValue({ objectUrl: "https://cdn/avatar.png" });
    (logTryOnEvent as jest.Mock).mockResolvedValue(undefined);
    global.crypto = { randomUUID: () => "uuid-test" } as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.crypto = originalCrypto;
  });

  it("walks through upload, preprocess and enhance with retry", async () => {
    (logTryOnEvent as jest.Mock).mockRejectedValueOnce(new Error("analytics"));
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ maskUrl: "mask" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ depthUrl: "depth" }) })
      .mockRejectedValueOnce(new Error("pose"))
      .mockResolvedValueOnce({ ok: true, body: createStream(["event: enhance\ndata: {\"progress\":0.5}\n\n"]) })
      .mockResolvedValueOnce({
        ok: true,
        body: createStream([
          "event: enhance\ndata: {\"progress\":0.75}\n\n",
          "event: final\ndata: {\"url\":\"https://result\"}\n\n",
        ]),
      });
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useTryOnController());

    let jobId = "";
    await act(async () => {
      const info = await result.current.startUpload(file, { productId: "p1", mode: "garment" });
      jobId = info.jobId;
    });
    expect(jobId).toBeTruthy();
    const ctx = (setTryOnCtx as jest.Mock).mock.calls.at(-1)?.[0];
    expect(ctx).toEqual(expect.objectContaining({ productId: "p1", mode: "garment", idempotencyKey: jobId }));
    expect(uploadMock).toHaveBeenCalledWith(file, { idempotencyKey: jobId });

    await act(async () => {
      await result.current.preprocess({ imageUrl: "https://cdn/avatar.png", jobId });
    });
    expect(result.current.state.phase).toBe("preview");
    expect(result.current.state.maskUrl).toBe("mask");
    expect(result.current.state.depthUrl).toBe("depth");
    expect(result.current.canEnhance).toBe(true);

    await act(async () => {
      await result.current.enhance({
        mode: "garment",
        productId: "p1",
        sourceImageUrl: "https://cdn/avatar.png",
        garmentAssets: {},
      });
    });

    expect(result.current.state.phase).toBe("done");
    expect(result.current.state.resultUrl).toBe("https://result");
    expect(result.current.progress).toBe(1);
    expect(logTryOnEvent).toHaveBeenCalledWith("TryOnPreviewShown", expect.any(Object));
    expect(logTryOnEvent).toHaveBeenCalledWith("TryOnEnhanced");
  });

  it("marks failure when the enhance response is not ok", async () => {
    (useDirectR2Upload as jest.Mock).mockReturnValue({ upload: uploadMock, progress: null, error: null });
    uploadMock.mockResolvedValue({ objectUrl: "https://cdn/avatar.png" });
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, body: undefined })
      .mockResolvedValueOnce({ ok: false, status: 500, body: undefined });
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useTryOnController());

    await act(async () => {
      await result.current.startUpload(file, {});
    });
    await act(async () => {
      await result.current.enhance({
        mode: "garment",
        productId: "p1",
        sourceImageUrl: "https://cdn/avatar.png",
        garmentAssets: {},
      });
    });

    expect(result.current.state.phase).toBe("failed");
    expect(result.current.state.error).toContain("Enhance failed");
  });

  it("handles preprocess fetch failures by falling back to empty objects", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("segment"))
      .mockRejectedValueOnce(new Error("depth"))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ poseUrl: "pose-url" }) })
      .mockResolvedValue({ ok: true, body: createStream(["event: final\ndata: {\"url\":\"https://result\"}\n\n"]) });
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useTryOnController());

    let jobId = "";
    await act(async () => {
      const info = await result.current.startUpload(file, {});
      jobId = info.jobId;
    });

    await act(async () => {
      await result.current.preprocess({ imageUrl: "https://cdn/avatar.png", jobId });
    });

    expect(result.current.state.phase).toBe("preview");
    expect(result.current.state.maskUrl).toBeUndefined();
    expect(result.current.state.depthUrl).toBeUndefined();
    expect(result.current.state.poseUrl).toBe("pose-url");
  });

  it("logs try-on errors from stream events", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ maskUrl: "mask" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ depthUrl: "depth" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ poseUrl: "pose" }) })
      .mockResolvedValueOnce({
        ok: true,
        body: createStream([
          "event: enhance\ndata: {\"progress\":0.25}\n\n",
          "event: error\ndata: {\"code\":\"E1\",\"message\":\"boom\"}\n\n",
          "event: final\ndata: {\"url\":\"https://final\"}\n\n",
        ]),
      });
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useTryOnController());

    let jobId = "";
    await act(async () => {
      const info = await result.current.startUpload(file, {});
      jobId = info.jobId;
    });
    await waitFor(() => expect(result.current.state.phase).toBe("preprocessed"));
    await act(async () => {
      await result.current.preprocess({ imageUrl: "https://cdn/avatar.png", jobId });
    });
    await waitFor(() => expect(result.current.state.phase).toBe("preview"));
    await act(async () => {
      await result.current.enhance({
        mode: "garment",
        productId: "p1",
        sourceImageUrl: "https://cdn/avatar.png",
        garmentAssets: {},
      });
    });

    expect(logTryOnEvent).toHaveBeenCalledWith("TryOnError", { code: "E1", message: "boom" });
    expect(result.current.state.resultUrl).toBe("https://final");
    expect(result.current.state.phase).toBe("done");
  });

  it("handles data-less chunks and defaults error messages", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ maskUrl: "mask" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ depthUrl: "depth" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ poseUrl: "pose" }) })
      .mockResolvedValueOnce({
        ok: true,
        body: createStream([
          "event: ping\n\n",
          `event: error\ndata: ${JSON.stringify({ code: "E2" })}\n\n`,
          `event: final\ndata: ${JSON.stringify({ url: "https://retry" })}\n\n`,
        ]),
      });
    global.fetch = fetchMock as any;

    const { result } = renderHook(() => useTryOnController());

    let jobId = "";
    await act(async () => {
      const info = await result.current.startUpload(file, {});
      jobId = info.jobId;
    });
    await act(async () => {
      await result.current.preprocess({ imageUrl: "https://cdn/avatar.png", jobId });
    });

    await act(async () => {
      await result.current.enhance({
        mode: "garment",
        productId: "p1",
        sourceImageUrl: "https://cdn/avatar.png",
        garmentAssets: {},
      });
    });

    expect(result.current.state.error).toBe("Unknown error");
    expect(result.current.state.resultUrl).toBe("https://retry");
    expect(logTryOnEvent).toHaveBeenCalledWith("TryOnError", { code: "E2", message: undefined });
  });
});

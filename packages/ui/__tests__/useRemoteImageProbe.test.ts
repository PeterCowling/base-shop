import { act,renderHook } from "@testing-library/react";

import useRemoteImageProbe from "../src/hooks/useRemoteImageProbe";

describe("useRemoteImageProbe", () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => "image/png" },
    } as any);
    (global as any).fetch = mockFetch;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("marks url valid when content-type is image", async () => {
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("http://example.com/a.png");
    });
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/media/probe?url=http%3A%2F%2Fexample.com%2Fa.png",
      { method: "HEAD" }
    );
    expect(result.current.error).toBeNull();
    expect(result.current.valid).toBe(true);
  });

  it("ignores empty url and does not fetch", async () => {
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("");
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.valid).toBeNull();
  });

  it("sets loading during fetch and resets after success", async () => {
    let resolveFetch: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockFetch.mockReturnValueOnce(fetchPromise as any);
    const { result } = renderHook(() => useRemoteImageProbe());

    let probePromise: Promise<void>;
    act(() => {
      probePromise = result.current.probe("http://example.com/image.png");
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveFetch({
        ok: true,
        headers: { get: () => "image/png" },
      } as any);
      await probePromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it("flags non-image content-types", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "text/html" },
    } as any);
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("http://example.com/");
    });
    expect(result.current.error).toBe("not-image");
    expect(result.current.valid).toBe(false);
  });

  it("handles non-ok responses", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      headers: { get: () => "image/png" },
    } as any);
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("http://example.com/bad.png");
    });
    expect(result.current.error).toBe("not-image");
    expect(result.current.valid).toBe(false);
  });

  it("sets loading during fetch and resets after failure", async () => {
    let rejectFetch: (reason?: unknown) => void;
    const fetchPromise = new Promise((_resolve, reject) => {
      rejectFetch = reject;
    });
    mockFetch.mockReturnValueOnce(fetchPromise as any);
    const { result } = renderHook(() => useRemoteImageProbe());

    let probePromise: Promise<void>;
    act(() => {
      probePromise = result.current.probe("http://example.com/fail.png");
    });
    expect(result.current.loading).toBe(true);

    await act(async () => {
      rejectFetch(new Error("network"));
      await probePromise;
    });

    expect(result.current.loading).toBe(false);
  });

  it("surfaces network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("http://example.com/error.png");
    });
    expect(result.current.error).toBe("network");
    expect(result.current.valid).toBe(false);
  });
});

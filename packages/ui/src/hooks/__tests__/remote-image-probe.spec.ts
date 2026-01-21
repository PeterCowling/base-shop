/* i18n-exempt file -- test titles and messages are developer-facing */
import { act,renderHook } from "@testing-library/react";

import useRemoteImageProbe from "../useRemoteImageProbe";

describe("useRemoteImageProbe", () => {
  const originalFetch: typeof fetch = globalThis.fetch;
  const mockFetch = jest.fn<Promise<Response>, Parameters<typeof fetch>>();

  beforeEach(() => {
    mockFetch.mockReset();
    (globalThis as unknown as { fetch: typeof fetch }).fetch =
      mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    (globalThis as unknown as { fetch: typeof fetch }).fetch = originalFetch;
  });

  it("marks url valid and reports loading state", async () => {
    let resolveFetch!: (value: Response) => void;
    const fetchPromise = new Promise<Response>((res) => {
      resolveFetch = res;
    });
    mockFetch.mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() => useRemoteImageProbe());

    let probePromise: Promise<void>;
    act(() => {
      probePromise = result.current.probe("http://example.com/a.png");
    });

    expect(result.current.loading).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/media/probe?url=http%3A%2F%2Fexample.com%2Fa.png",
      { method: "HEAD" }
    );

    await act(async () => {
      resolveFetch({
        ok: true,
        headers: { get: () => "image/png" } as unknown as Headers,
      } as unknown as Response);
      await probePromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.valid).toBe(true);
  });

  it("flags non-image content-types", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "text/html" } as unknown as Headers,
    } as unknown as Response);

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
      headers: { get: () => "image/png" } as unknown as Headers,
    } as unknown as Response);

    const { result } = renderHook(() => useRemoteImageProbe());

    await act(async () => {
      await result.current.probe("http://example.com/a.png");
    });

    expect(result.current.error).toBe("not-image");
    expect(result.current.valid).toBe(false);
  });

  it("resets valid when url is empty", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      headers: { get: () => "image/png" } as unknown as Headers,
    } as unknown as Response);

    const { result } = renderHook(() => useRemoteImageProbe());

    await act(async () => {
      await result.current.probe("http://example.com/a.png");
    });
    expect(result.current.valid).toBe(true);

    await act(async () => {
      await result.current.probe("");
    });

    expect(result.current.valid).toBeNull();
  });

  it("propagates fetch errors", async () => {
    let rejectFetch!: (reason?: unknown) => void;
    const fetchPromise = new Promise<Response>((_, rej) => {
      rejectFetch = rej;
    });
    mockFetch.mockReturnValueOnce(fetchPromise);

    const { result } = renderHook(() => useRemoteImageProbe());

    let probePromise: Promise<void>;
    act(() => {
      probePromise = result.current.probe("http://example.com/a.png");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      rejectFetch!(new Error("boom"));
      await probePromise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("boom");
    expect(result.current.valid).toBe(false);
  });
});

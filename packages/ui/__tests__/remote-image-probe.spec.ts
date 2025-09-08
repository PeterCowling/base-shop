import { renderHook, act } from "@testing-library/react";
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
});

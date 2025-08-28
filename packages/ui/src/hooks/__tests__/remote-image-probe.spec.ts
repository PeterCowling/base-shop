import { act, renderHook } from "@testing-library/react";
import { useRemoteImageProbe } from "../useRemoteImageProbe";

describe("useRemoteImageProbe", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("resolves when url points to image", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
    });
    (global as any).fetch = fetchMock;

    const { result } = renderHook(() => useRemoteImageProbe());
    let ok = false;
    await act(async () => {
      ok = await result.current.probe("https://example.com/a.png");
    });
    expect(ok).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("sets error when url is not image", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "text/html" }),
    });
    (global as any).fetch = fetchMock;

    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/");
    });
    expect(result.current.error).toBe("Invalid image");
  });

  it("surfaces network errors", async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValue(new Error("network"));
    (global as any).fetch = fetchMock;

    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/");
    });
    expect(result.current.error).toBe("network");
  });
});

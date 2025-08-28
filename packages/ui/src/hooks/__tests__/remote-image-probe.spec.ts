import { renderHook, act } from "@testing-library/react";
import useRemoteImageProbe from "../useRemoteImageProbe";

describe("useRemoteImageProbe", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  it("returns valid when probe succeeds", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, statusText: "OK" });
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/image.png");
    });
    expect(result.current.status).toBe("valid");
    expect(result.current.error).toBeNull();
  });

  it("returns invalid for non-image response", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 415, statusText: "Unsupported" });
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/not-image");
    });
    expect(result.current.status).toBe("invalid");
  });

  it("handles network errors", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/bad");
    });
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("fail");
  });
});

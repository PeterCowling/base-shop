// packages/ui/src/hooks/__tests__/useRemoteImageProbe.test.ts
// i18n-exempt: Test descriptions and fixtures use literal strings
import { renderHook, act } from "@testing-library/react";
import useRemoteImageProbe from "../useRemoteImageProbe";

describe("useRemoteImageProbe", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    // @ts-expect-error restore original fetch type
    global.fetch = originalFetch;
  });

  test("sets valid=true for ok image content-type", async () => {
    // @ts-expect-error mock fetch for test
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "image/png" }),
    });
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/a.png");
    });
    expect(result.current.valid).toBe(true);
    expect(result.current.error).toBeNull();
  });

  test("sets error when not ok or non-image", async () => {
    // @ts-expect-error mock fetch for test
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      headers: new Headers({ "content-type": "text/plain" }),
    });
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/a.txt");
    });
    expect(result.current.valid).toBe(false);
    expect(result.current.error).toBe("not-image");
  });

  test("sets error on fetch rejection", async () => {
    // @ts-expect-error mock fetch for test
    global.fetch = jest.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useRemoteImageProbe());
    await act(async () => {
      await result.current.probe("https://example.com/a.png");
    });
    expect(result.current.valid).toBe(false);
    expect(result.current.error).toBe("boom");
  });
});

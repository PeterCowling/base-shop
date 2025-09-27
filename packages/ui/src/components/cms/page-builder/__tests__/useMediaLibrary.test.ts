import { act, renderHook } from "@testing-library/react";
import useMediaLibrary from "../useMediaLibrary";

const getShopFromPath = jest.fn();

jest.mock("@acme/shared-utils", () => ({
  getShopFromPath: () => getShopFromPath(),
}));

const usePathname = jest.fn();
const useSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
}));

function mockFetchSuccess(data: unknown) {
  // @ts-expect-error TEST-123: assign mocked fetch on global
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  });
}

function mockFetchError(statusText: string) {
  // @ts-expect-error TEST-123: assign mocked fetch on global
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    statusText,
    json: async () => ({ error: statusText }),
  });
}

describe("useMediaLibrary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves shop from pathname", () => {
    getShopFromPath.mockReturnValue("s1");
    usePathname.mockReturnValue("/s1");
    useSearchParams.mockReturnValue(new URLSearchParams());

    const { result } = renderHook(() => useMediaLibrary());

    expect(result.current.shop).toBe("s1");
  });

  it("falls back to shopId query param", () => {
    getShopFromPath.mockReturnValue(undefined);
    usePathname.mockReturnValue("/");
    useSearchParams.mockReturnValue(new URLSearchParams("shopId=s2"));

    const { result } = renderHook(() => useMediaLibrary());

    expect(result.current.shop).toBe("s2");
  });

  it("loadMedia is a no-op when shop is undefined", async () => {
    getShopFromPath.mockReturnValue(undefined);
    usePathname.mockReturnValue("");
    useSearchParams.mockReturnValue(null);

    const fetchSpy = jest.fn();
    // @ts-expect-error TEST-123: assign mocked fetch on global
    global.fetch = fetchSpy;

    const { result } = renderHook(() => useMediaLibrary());

    await result.current.loadMedia();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.current.media).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it("updates media on successful array response", async () => {
    getShopFromPath.mockReturnValue("s1");
    usePathname.mockReturnValue("/s1");
    useSearchParams.mockReturnValue(new URLSearchParams());

    const items = [{ id: "1" } as any];
    mockFetchSuccess(items);

    const { result } = renderHook(() => useMediaLibrary());

    await act(async () => {
      await result.current.loadMedia();
    });

    expect(result.current.media).toEqual(items);
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it("leaves media empty on successful non-array response", async () => {
    getShopFromPath.mockReturnValue("s1");
    usePathname.mockReturnValue("/s1");
    useSearchParams.mockReturnValue(new URLSearchParams());

    mockFetchSuccess({ foo: "bar" });

    const { result } = renderHook(() => useMediaLibrary());

    await act(async () => {
      await result.current.loadMedia();
    });

    expect(result.current.media).toEqual([]);
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(false);
  });

  it("sets error when fetch fails and resets loading", async () => {
    getShopFromPath.mockReturnValue("s1");
    usePathname.mockReturnValue("/s1");
    useSearchParams.mockReturnValue(new URLSearchParams());

    mockFetchError("bad");

    const { result } = renderHook(() => useMediaLibrary());

    await act(async () => {
      await result.current.loadMedia();
    });

    expect(result.current.error).toBe("bad");
    expect(result.current.loading).toBe(false);
    expect(result.current.media).toEqual([]);
  });
});

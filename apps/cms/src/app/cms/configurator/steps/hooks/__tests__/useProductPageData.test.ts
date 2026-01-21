import { act, renderHook, waitFor } from "@testing-library/react";

import useProductPageData from "../useProductPageData";

const apiRequest = jest.fn();
jest.mock("../../../lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

describe("useProductPageData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const store: Record<string, string> = {};
    const localStorageMock = {
      getItem: jest.fn((key: string) => store[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete store[key];
      }),
      clear: jest.fn(() => {
        for (const k of Object.keys(store)) delete store[k];
      }),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      configurable: true,
    });
  });

  it("fetches existing page and sets state", async () => {
    apiRequest.mockResolvedValueOnce({
      data: [
        {
          id: "p1",
          slug: "product",
          components: [{ id: "c" }],
          history: { past: [], present: [], future: [] },
        },
      ],
      error: null,
    });
    const setProductPageId = jest.fn();
    const setProductComponents = jest.fn();
    const setToast = jest.fn();
    renderHook(() =>
      useProductPageData({
        shopId: "shop",
        productPageId: null,
        setProductPageId,
        setProductComponents,
        setToast,
      }),
    );
    await waitFor(() => expect(setProductPageId).toHaveBeenCalledWith("p1"));
    expect(setProductComponents).toHaveBeenCalledWith([{ id: "c" }]);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "page-builder-history-p1",
      expect.any(String),
    );
  });

  it("handles save success and error", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: { id: "1" }, error: null })
      .mockResolvedValueOnce({ data: null, error: "save error" });
    const setProductPageId = jest.fn();
    const setProductComponents = jest.fn();
    const setToast = jest.fn();
    const { result } = renderHook(() =>
      useProductPageData({
        shopId: "shop",
        productPageId: null,
        setProductPageId,
        setProductComponents,
        setToast,
      }),
    );
    await act(async () => {
      await result.current.saveDraft(new FormData());
    });
    expect(setProductPageId).toHaveBeenCalledWith("1");
    expect(setToast).toHaveBeenCalledWith({ open: true, message: "Draft saved" });
    await act(async () => {
      await result.current.saveDraft(new FormData());
    });
    expect(result.current.saveError).toBe("save error");
  });

  it("handles publish success and error", async () => {
    apiRequest
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: { id: "2" }, error: null })
      .mockResolvedValueOnce({ data: null, error: "publish error" });
    const setProductPageId = jest.fn();
    const setProductComponents = jest.fn();
    const setToast = jest.fn();
    const { result } = renderHook(() =>
      useProductPageData({
        shopId: "shop",
        productPageId: null,
        setProductPageId,
        setProductComponents,
        setToast,
      }),
    );
    await act(async () => {
      await result.current.publishPage(new FormData());
    });
    expect(setProductPageId).toHaveBeenCalledWith("2");
    expect(setToast).toHaveBeenCalledWith({ open: true, message: "Page published" });
    await act(async () => {
      await result.current.publishPage(new FormData());
    });
    expect(result.current.publishError).toBe("publish error");
  });
});


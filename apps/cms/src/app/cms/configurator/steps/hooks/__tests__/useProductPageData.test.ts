import { act, renderHook, waitFor } from "@testing-library/react";

import useProductPageData from "../useProductPageData";

const apiRequest = jest.fn();
jest.mock("../../../lib/api", () => ({
  apiRequest: (...args: any[]) => apiRequest(...args),
}));

const mockToastMessages: { type: string; message: string }[] = [];
jest.mock("@acme/ui/operations", () => ({
  __esModule: true,
  useToast: () => ({
    success: (message: string) => { mockToastMessages.push({ type: "success", message }); },
    error: (message: string) => { mockToastMessages.push({ type: "error", message }); },
    warning: (message: string) => { mockToastMessages.push({ type: "warning", message }); },
    info: (message: string) => { mockToastMessages.push({ type: "info", message }); },
    loading: (message: string) => { mockToastMessages.push({ type: "loading", message }); },
    dismiss: () => {},
    update: () => {},
    promise: async (p: Promise<unknown>) => p,
  }),
}));

describe("useProductPageData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToastMessages.length = 0;
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
    renderHook(() =>
      useProductPageData({
        shopId: "shop",
        productPageId: null,
        setProductPageId,
        setProductComponents,
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
    const { result } = renderHook(() =>
      useProductPageData({
        shopId: "shop",
        productPageId: null,
        setProductPageId,
        setProductComponents,
      }),
    );
    await act(async () => {
      await result.current.saveDraft(new FormData());
    });
    expect(setProductPageId).toHaveBeenCalledWith("1");
    expect(mockToastMessages).toContainEqual(
      expect.objectContaining({ type: "success", message: "Draft saved" }),
    );
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
    const { result } = renderHook(() =>
      useProductPageData({
        shopId: "shop",
        productPageId: null,
        setProductPageId,
        setProductComponents,
      }),
    );
    await act(async () => {
      await result.current.publishPage(new FormData());
    });
    expect(setProductPageId).toHaveBeenCalledWith("2");
    expect(mockToastMessages).toContainEqual(
      expect.objectContaining({ type: "success", message: "Page published" }),
    );
    await act(async () => {
      await result.current.publishPage(new FormData());
    });
    expect(result.current.publishError).toBe("publish error");
  });
});

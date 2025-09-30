// packages/ui/src/hooks/tryon/__tests__/useTryOnAnalytics.test.tsx
import { act, renderHook, waitFor } from "@testing-library/react";
import type { UseTryOnAnalyticsOptions } from "../useTryOnAnalytics";
import { useTryOnAnalytics } from "../useTryOnAnalytics";

const mockUseParams = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => mockUseParams(),
}));

jest.mock("../analytics", () => ({
  getTryOnCtx: jest.fn(() => ({ productId: "ctx-product", mode: "accessory" })),
  setTryOnCtx: jest.fn(),
  logTryOnEvent: jest.fn().mockResolvedValue(undefined),
}));

import { getTryOnCtx, setTryOnCtx, logTryOnEvent } from "../analytics";

describe("useTryOnAnalytics", () => { // i18n-exempt: test titles
  const mockGetTryOnCtx = getTryOnCtx as jest.MockedFunction<typeof getTryOnCtx>;
  const mockSetTryOnCtx = setTryOnCtx as jest.MockedFunction<typeof setTryOnCtx>;
  const mockLogTryOnEvent = logTryOnEvent as jest.MockedFunction<typeof logTryOnEvent>;

  beforeEach(() => {
    mockUseParams.mockReset();
    mockGetTryOnCtx.mockClear();
    mockSetTryOnCtx.mockClear();
    mockLogTryOnEvent.mockClear();
    mockLogTryOnEvent.mockResolvedValue(undefined);
    mockGetTryOnCtx.mockReturnValue({ productId: "ctx-product", mode: "accessory" });
  });

  test("infers slug from params and exposes helpers", async () => { // i18n-exempt: test title
    mockUseParams.mockReturnValue({ slug: "route-slug" });

    const { result } = renderHook(() => useTryOnAnalytics());

    await waitFor(() =>
      expect(mockSetTryOnCtx).toHaveBeenCalledWith({ productId: "route-slug", mode: "accessory" })
    );

    expect(result.current.ctx).toEqual({ productId: "ctx-product", mode: "accessory" });
    expect(result.current.setCtx).toBe(mockSetTryOnCtx);

    await act(async () => {
      result.current.clear();
    });
    expect(mockSetTryOnCtx).toHaveBeenLastCalledWith({
      productId: undefined,
      mode: undefined,
      idempotencyKey: undefined,
    });
  });

  test("respects explicit productId and mode overrides", async () => { // i18n-exempt: test title
    mockUseParams.mockReturnValue({ slug: ["ignored", "second"] });

    const opts: UseTryOnAnalyticsOptions = { productId: "override", mode: "garment" };
    renderHook(() => useTryOnAnalytics(opts));

    await waitFor(() =>
      expect(mockSetTryOnCtx).toHaveBeenCalledWith({ productId: "override", mode: "garment" })
    );
  });

  test("handles missing slug and triggers analytics events", async () => { // i18n-exempt: test title
    mockUseParams.mockReturnValue(null);

    const { result } = renderHook(() => useTryOnAnalytics());

    // No slug means the setup effect should not push a product id
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockSetTryOnCtx).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.started();
      await result.current.started("idem-1");
      await result.current.previewShown();
      await result.current.previewShown(1200);
      await result.current.enhanced();
      await result.current.enhanced(2200);
      await result.current.addToCart();
      await result.current.addToCart({ color: "black" });
      await result.current.error("ERR_CODE", "Readable message");
    });

    expect(mockSetTryOnCtx).toHaveBeenCalledWith({ idempotencyKey: "idem-1" });
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnStarted");
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnPreviewShown", undefined);
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnPreviewShown", { preprocessMs: 1200 });
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnEnhanced", undefined);
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnEnhanced", { generateMs: 2200 });
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnAddToCart", undefined);
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnAddToCart", { transform: { color: "black" } });
    expect(mockLogTryOnEvent).toHaveBeenCalledWith("TryOnError", { code: "ERR_CODE", message: "Readable message" });
  });
});

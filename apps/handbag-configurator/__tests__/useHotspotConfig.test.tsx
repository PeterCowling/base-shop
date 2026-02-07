import { act, renderHook, waitFor } from "@testing-library/react";

import type { ProductHotspotConfig } from "@acme/product-configurator";

import { useHotspotConfig } from "../src/viewer/hotspots/useHotspotConfig";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("useHotspotConfig", () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("loads hotspot config and returns idle status", async () => {
    const sample: ProductHotspotConfig = {
      productId: "bag-1",
      version: "1.0.0",
      hotspots: [{ id: "hs_1", regionId: "body", label: "Body" }],
    };

    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: async () => sample,
    } as Response);

    const { result } = renderHook(() => useHotspotConfig("bag-1"));

    await waitFor(() => expect(result.current.config).toEqual(sample));
    expect(result.current.status).toBe("idle");
    expect(fetchSpy).toHaveBeenCalledWith("/api/products/bag-1/hotspots");
  });

  it("sets error status when load fails", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false } as Response);

    const { result } = renderHook(() => useHotspotConfig("bag-1"));

    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("saves offsets and posts the updated payload", async () => {
    const sample: ProductHotspotConfig = {
      productId: "bag-1",
      version: "1.0.0",
      hotspots: [{ id: "hs_1", regionId: "body" }],
    };

    fetchSpy
      .mockResolvedValueOnce({
        ok: true,
        json: async () => sample,
      } as Response)
      .mockResolvedValueOnce({ ok: true } as Response);

    const { result } = renderHook(() => useHotspotConfig("bag-1"));

    await waitFor(() => expect(result.current.config).toEqual(sample));

    await act(async () => {
      await result.current.saveOffsets({ hs_1: { x: 0.3, y: -0.1 } });
    });

    expect(result.current.config?.hotspots[0]?.offset).toEqual({ x: 0.3, y: -0.1 });

    const [, saveCall] = fetchSpy.mock.calls;
    expect(saveCall?.[0]).toBe("/api/products/bag-1/hotspots");
    const options = saveCall?.[1] as RequestInit;
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ "Content-Type": "application/json" });
    const payload = JSON.parse(options?.body as string) as ProductHotspotConfig;
    expect(payload.hotspots[0]?.offset).toEqual({ x: 0.3, y: -0.1 });
  });

  it("no-ops when saveOffsets runs before config loads", async () => {
    let resolveFetch: (value: Response) => void;
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    fetchSpy.mockReturnValue(fetchPromise as unknown as Promise<Response>);

    const { result } = renderHook(() => useHotspotConfig("bag-1"));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.saveOffsets({ hs_1: { x: 0.2, y: 0.1 } });
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch!({ ok: false } as Response);
    });

    await waitFor(() => expect(result.current.status).toBe("error"));
  });
});

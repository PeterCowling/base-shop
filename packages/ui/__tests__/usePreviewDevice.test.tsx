import { act, renderHook, waitFor } from "@testing-library/react";

import {
  PREVIEW_DEVICE_STORAGE_KEY,
  usePreviewDevice,
} from "../src/hooks/usePreviewDevice";

describe("usePreviewDevice", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  it("uses the device id stored in localStorage", async () => {
    const getItem = jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue("tablet");
    const setItem = jest.spyOn(Storage.prototype, "setItem");

    const { result } = renderHook(() => usePreviewDevice("desktop"));

    await waitFor(() => expect(result.current[0]).toBe("tablet"));
    expect(getItem).toHaveBeenCalledWith(PREVIEW_DEVICE_STORAGE_KEY);
    expect(setItem).toHaveBeenCalledWith(
      PREVIEW_DEVICE_STORAGE_KEY,
      "tablet",
    );
  });

  it("falls back to the initial id when storage access throws", () => {
    jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });

    const { result } = renderHook(() => usePreviewDevice("desktop"));

    expect(result.current[0]).toBe("desktop");
  });

  it("updates device id even when persistence fails", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });

    const { result } = renderHook(() => usePreviewDevice("desktop"));

    expect(() =>
      act(() => {
        result.current[1]("mobile");
      }),
    ).not.toThrow();

    expect(result.current[0]).toBe("mobile");
    expect(setItem).toHaveBeenCalledWith(
      PREVIEW_DEVICE_STORAGE_KEY,
      "mobile",
    );
    expect(localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY)).toBeNull();
  });

  it("persists device id changes", async () => {
    const { result } = renderHook(() => usePreviewDevice("desktop"));

    act(() => {
      result.current[1]("mobile");
    });

    await waitFor(() =>
      expect(localStorage.getItem(PREVIEW_DEVICE_STORAGE_KEY)).toBe("mobile"),
    );
  });
});


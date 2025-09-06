import { renderHook, act, waitFor } from "@testing-library/react";
import {
  usePreviewDevice,
  PREVIEW_DEVICE_STORAGE_KEY,
} from "../usePreviewDevice";

describe("usePreviewDevice", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("defaults to the initial id when no value is stored", () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
    const { result } = renderHook(() => usePreviewDevice("desktop"));

    expect(result.current[0]).toBe("desktop");
    expect(window.localStorage.getItem).toHaveBeenCalledWith(
      PREVIEW_DEVICE_STORAGE_KEY,
    );
  });

  it("loads a stored device id", async () => {
    jest.spyOn(Storage.prototype, "getItem").mockReturnValue("tablet");
    const setItem = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => undefined);

    const { result } = renderHook(() => usePreviewDevice("desktop"));

    await waitFor(() => expect(result.current[0]).toBe("tablet"));
    expect(setItem).toHaveBeenCalledWith(
      PREVIEW_DEVICE_STORAGE_KEY,
      "tablet",
    );
  });

  it("continues gracefully when storage access fails", () => {
    jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });
    jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });

    const { result } = renderHook(() => usePreviewDevice("desktop"));

    expect(result.current[0]).toBe("desktop");
    act(() => {
      result.current[1]("mobile");
    });
    expect(result.current[0]).toBe("mobile");
  });
});


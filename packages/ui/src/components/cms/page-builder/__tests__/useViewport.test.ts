import { act,renderHook } from "@testing-library/react";

import type { DevicePreset } from "../../../../utils/devicePresets";
import useViewport from "../hooks/useViewport";

describe("useViewport", () => {
  const desktop: DevicePreset = {
    id: "desktop",
    label: "Desktop",
    type: "desktop",
    width: 1000,
    height: 800,
    orientation: "portrait",
  };

  const mobile: DevicePreset = {
    id: "mobile",
    label: "Mobile",
    type: "mobile",
    width: 500,
    height: 400,
    orientation: "portrait",
  };

  let rafCallback: FrameRequestCallback;
  beforeEach(() => {
    jest.useFakeTimers();
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        rafCallback = cb;
        return 0;
      });
  });

  afterEach(() => {
    (window.requestAnimationFrame as jest.Mock).mockRestore();
    jest.useRealTimers();
  });

  it("updates dimensions and animates scale", () => {
    const { result, rerender } = renderHook(
      ({ device }) => useViewport(device),
      { initialProps: { device: desktop } }
    );

    expect(result.current.canvasWidth).toBe(1000);
    expect(result.current.canvasHeight).toBe(800);
    expect(result.current.viewportStyle.transform).toBe("scale(1)");

    act(() => {
      rerender({ device: mobile });
    });

    expect(result.current.canvasWidth).toBe(500);
    expect(result.current.canvasHeight).toBe(400);
    expect(result.current.viewportStyle.transform).toBe("scale(2)");

    act(() => {
      rafCallback(0);
    });

    expect(result.current.scale).toBe(1);
    expect(result.current.viewportStyle.transform).toBe("scale(1)");
  });

  it("returns device frame classes", () => {
    const { result } = renderHook(() => useViewport(desktop));
    expect(result.current.frameClass).toEqual({
      desktop: "",
      tablet: "rounded-xl border border-muted-foreground/40 p-2",
      mobile: "rounded-4xl border border-muted-foreground/40 p-4",
    });
  });
});

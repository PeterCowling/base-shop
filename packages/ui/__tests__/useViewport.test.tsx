import { renderHook } from "@testing-library/react";
import useViewport from "../src/components/cms/page-builder/hooks/useViewport";
import type { DevicePreset } from "@ui/utils/devicePresets";

describe("useViewport", () => {
  const desktop: DevicePreset = {
    id: "d",
    label: "Desktop",
    type: "desktop",
    width: 1000,
    height: 800,
    orientation: "portrait",
  };
  const tablet: DevicePreset = {
    id: "t",
    label: "Tablet",
    type: "tablet",
    width: 500,
    height: 400,
    orientation: "portrait",
  };

  beforeEach(() => {
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });
  });

  afterEach(() => {
    (window.requestAnimationFrame as jest.Mock).mockRestore();
  });

  it("updates dimensions when device changes", () => {
    const { result, rerender } = renderHook(
      ({ device }) => useViewport(device),
      { initialProps: { device: desktop } }
    );

    expect(result.current.canvasWidth).toBe(1000);
    expect(result.current.canvasHeight).toBe(800);

    rerender({ device: tablet });

    expect(result.current.canvasWidth).toBe(500);
    expect(result.current.canvasHeight).toBe(400);
    expect(result.current.scale).toBe(1);
  });

  it("updates dimensions when orientation changes", () => {
    const { result, rerender } = renderHook(
      ({ device }) => useViewport(device),
      { initialProps: { device: desktop } }
    );

    const landscape = {
      ...desktop,
      width: desktop.height,
      height: desktop.width,
      orientation: "landscape" as const,
    };

    rerender({ device: landscape });

    expect(result.current.canvasWidth).toBe(800);
    expect(result.current.canvasHeight).toBe(1000);
  });
});

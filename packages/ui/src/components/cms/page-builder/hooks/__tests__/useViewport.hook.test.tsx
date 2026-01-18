// packages/ui/src/components/cms/page-builder/hooks/__tests__/useViewport.hook.test.tsx
import { renderHook, act } from "@testing-library/react";
import useViewport from "../useViewport";

describe("page-builder useViewport", () => {
  const originalRAF = global.requestAnimationFrame;
  const originalCancel = global.cancelAnimationFrame;
  beforeEach(() => {
    // Execute raf callbacks immediately
    global.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 1 as any;
    };
  });
  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCancel;
  });
  test("updates width/height and animates scale on device change", () => {
    const d1 = { id: "d1", label: "D1", width: 1000, height: 800, type: "desktop", orientation: "portrait" } as any;
    const d2 = { id: "d2", label: "D2", width: 500, height: 400, type: "mobile", orientation: "portrait" } as any;
    const { result, rerender } = renderHook(({ dev }) => useViewport(dev as any), { initialProps: { dev: d1 } });
    expect(result.current.canvasWidth).toBe(1000);
    expect(result.current.canvasHeight).toBe(800);
    // change device, scale animates from prev width / new width then resets to 1
    rerender({ dev: d2 });
    // With raf mocked to call immediately, scale should have been set back to 1
    expect(result.current.canvasWidth).toBe(500);
    expect(result.current.canvasHeight).toBe(400);
    expect(result.current.scale).toBe(1);
    // viewportStyle reflects width/height and scale
    expect(result.current.viewportStyle.width).toBe("500px");
    expect(result.current.viewportStyle.height).toBe("400px");
  });
});

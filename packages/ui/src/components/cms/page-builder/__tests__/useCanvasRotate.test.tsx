// packages/ui/src/components/cms/page-builder/__tests__/useCanvasRotate.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import useCanvasRotate from "../useCanvasRotate";

function Harness({ styles }: { styles?: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const dispatch = jest.fn();
  (globalThis as any).__rotateDispatch = dispatch;
  const { startRotate, rotating } = useCanvasRotate({
    componentId: "c1",
    styles,
    dispatch: dispatch as any,
    containerRef: ref,
    zoom: 1,
  });
  return (
    <div>
      <div
        ref={ref}
        data-cy="target"
        style={{ width: 100, height: 100 }}
        onPointerDown={(e) => startRotate(e as any)}
      />
      <div data-cy="rot" aria-label="rot">{String(rotating)}</div>
    </div>
  );
}

describe("useCanvasRotate", () => {
  test("startRotate toggles rotating state", () => {
    const { getByTestId } = render(<Harness styles={JSON.stringify({ effects: { transformRotate: "0deg" } })} />);
    const target = getByTestId("target");

    // Mock getBoundingClientRect for center math
    jest.spyOn(target, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100,
      x: 0, y: 0, toJSON: () => ({})
    } as any);

    fireEvent.pointerDown(target, { clientX: 100, clientY: 50, pointerId: 1 });
    expect(getByTestId("rot").textContent).toBe("true");

    // End rotation
    fireEvent.pointerUp(window);
  });
});

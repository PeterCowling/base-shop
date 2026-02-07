import React, { useMemo, useRef } from "react";
import { render, screen } from "@testing-library/react";

import useGridSize from "../useGridSize";

function Harness({ showGrid, gridCols, width }: { showGrid: boolean; gridCols: number; width: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Provide a fake element with offsetWidth
  const node = useMemo(() => ({ offsetWidth: width } as any), [width]);
  ref.current = node as any;
  const size = useGridSize(ref, { showGrid, gridCols });
  return <div data-cy="size">{size}</div>;
}

describe("useGridSize", () => {
  test("computes grid size when grid is shown", async () => {
    render(<Harness showGrid gridCols={12} width={1200} />);
    const el = await screen.findByTestId("size");
    expect(Number(el.textContent)).toBe(100);
  });

  test("returns 1 when grid is hidden", async () => {
    render(<Harness showGrid={false} gridCols={12} width={1200} />);
    const el = await screen.findByTestId("size");
    expect(Number(el.textContent)).toBe(1);
  });

  test("updates when column count changes", async () => {
    const { rerender } = render(<Harness showGrid gridCols={12} width={600} />);
    let el = await screen.findByTestId("size");
    expect(Number(el.textContent)).toBe(50);
    rerender(<Harness showGrid gridCols={6} width={600} />);
    el = await screen.findByTestId("size");
    expect(Number(el.textContent)).toBe(100);
  });
});
